import express from "express";
import bcrypt from "bcryptjs";
import BillingHandoff from "../models/BillingHandoff.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import Organization from "../models/Organization.js";
import razorpayService from "../services/razorpay.service.js";
import { finalizeCapturedPayment } from "../services/billing-payment-finalization.service.js";
import { sendTemplateEmail } from "../services/aws-ses.service.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import {
    formatPaise,
    handoffTokenCandidates,
    maskEmail,
} from "../services/billing-handoff.service.js";
import { PAYMENT_ATTEMPT_STAGE } from "../utils/billing.utils.js";

const router = express.Router();
router.use(generalLimiter);

function checkoutError(res, error) {
    const status = Number(error?.statusCode) || 500;
    if (status >= 500) console.error("[Billing Checkout]", error);
    return res.status(status).json({
        success: false,
        code: error?.code || "CHECKOUT_FAILED",
        error: status >= 500 ? "Unable to complete secure checkout" : error.message,
    });
}

function activeTokenQuery(rawToken) {
    return {
        token: { $in: handoffTokenCandidates(rawToken) },
        verified: false,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
    };
}

router.get("/session", async (req, res) => {
    try {
        const rawToken = req.query.token;
        if (!rawToken) return res.status(400).json({ success: false, error: "Token is required" });
        const handoff = await BillingHandoff.findOne(activeTokenQuery(rawToken)).lean();
        if (!handoff) return res.status(404).json({ success: false, error: "Invalid or expired session" });
        const organization = await Organization.findById(handoff.organization_id).select("name").lean();

        return res.json({
            success: true,
            data: {
                organizationName: organization?.name || "Organization",
                maskedEmail: maskEmail(handoff.email),
                amountPaise: handoff.amountPaise,
                currency: handoff.currency,
                paymentType: handoff.payment_type,
                label: handoff.context?.label || "Payment",
                expiresAt: handoff.expiresAt,
                otpVerified: Boolean(handoff.otpVerifiedAt),
            },
        });
    } catch (error) {
        return checkoutError(res, error);
    }
});

router.post("/verify-otp", async (req, res) => {
    try {
        const { token: rawToken, otp } = req.body;
        if (!rawToken || !/^\d{6}$/.test(String(otp || ""))) {
            return res.status(400).json({ success: false, error: "A valid token and 6-digit OTP are required" });
        }

        const handoff = await BillingHandoff.findOne(activeTokenQuery(rawToken)).select("+token +otp");
        if (!handoff) return res.status(404).json({ success: false, error: "Invalid or expired session" });
        if (handoff.otpVerifiedAt) {
            return res.status(409).json({ success: false, error: "OTP was already verified" });
        }
        if (handoff.lockoutUntil && handoff.lockoutUntil > new Date()) {
            return res.status(429).json({ success: false, error: "Too many failed attempts. Try again later." });
        }

        const isMatch = await bcrypt.compare(String(otp), handoff.otp);
        if (!isMatch) {
            const attempts = handoff.attempts + 1;
            await BillingHandoff.findByIdAndUpdate(handoff._id, {
                $set: {
                    attempts,
                    lockoutUntil: attempts >= 3 ? new Date(Date.now() + 15 * 60 * 1000) : null,
                },
            });
            return res.status(400).json({ success: false, error: "Invalid OTP" });
        }

        const verified = await BillingHandoff.findOneAndUpdate(
            { _id: handoff._id, otpVerifiedAt: null, consumedAt: null, verified: false },
            {
                $set: {
                    otp: "CONSUMED",
                    otpVerifiedAt: new Date(),
                    attempts: 0,
                    lockoutUntil: null,
                },
            },
            { returnDocument: 'after' }
        );
        if (!verified) {
            return res.status(409).json({ success: false, error: "OTP was already consumed" });
        }
        await PaymentAttempt.findByIdAndUpdate(verified.paymentAttemptId, {
            stage: PAYMENT_ATTEMPT_STAGE.OTP_VERIFIED,
        });

        return res.json({
            success: true,
            data: {
                razorpay_order_id: verified.razorpay_order_id,
                razorpay_key_id: verified.razorpay_key_id,
                amountPaise: verified.amountPaise,
                currency: verified.currency,
                email: verified.email,
                return_url: verified.return_url,
            },
        });
    } catch (error) {
        return checkoutError(res, error);
    }
});

router.post("/confirm", async (req, res) => {
    try {
        const {
            token: rawToken,
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
        } = req.body;
        if (!rawToken || !paymentId || !orderId || !signature) {
            return res.status(400).json({ success: false, error: "Missing payment confirmation details" });
        }

        const handoff = await BillingHandoff.findOne({
            ...activeTokenQuery(rawToken),
            otpVerifiedAt: { $ne: null },
        }).select("+token +otp");
        if (!handoff) return res.status(404).json({ success: false, error: "Invalid, expired, or unverified session" });
        if (orderId !== handoff.razorpay_order_id) {
            return res.status(400).json({ success: false, code: "PAYMENT_ORDER_MISMATCH", error: "Payment order does not match this session" });
        }

        let signatureValid = false;
        let providerPayment;
        if (handoff.payment_type === "saas_invoice") {
            signatureValid = razorpayService.verifyPlatformSignature(orderId, paymentId, signature);
            if (signatureValid) providerPayment = await razorpayService.fetchPlatformPayment(paymentId);
        } else {
            const providerModule = handoff.payment_type === "canteen_order" ? "canteen" : "fees";
            signatureValid = await razorpayService.verifySignature(
                handoff.organization_id,
                orderId,
                paymentId,
                signature,
                providerModule
            );
            if (signatureValid) {
                providerPayment = await razorpayService.fetchPayment(handoff.organization_id, paymentId, providerModule);
            }
        }
        if (!signatureValid) {
            return res.status(400).json({ success: false, code: "INVALID_PAYMENT_SIGNATURE", error: "Invalid payment signature" });
        }
        if (!providerPayment || providerPayment.id !== paymentId) {
            return res.status(400).json({ success: false, code: "PAYMENT_NOT_FOUND", error: "Provider payment could not be verified" });
        }

        const finalized = await finalizeCapturedPayment({
            handoffId: handoff._id,
            providerPayment,
            requestContext: {
                ip: req.ip,
                requestId: req.headers["x-request-id"] || req.headers["x-correlation-id"] || null,
            },
        });

        const organization = await Organization.findById(handoff.organization_id).select("name").lean();
        const templateName = handoff.payment_type === "saas_invoice"
            ? "SAAS_PAYMENT_SUCCESSFUL"
            : "INSTITUTION_PAYMENT_SUCCESSFUL_PAYER";
        await sendTemplateEmail({
            templateName,
            to: handoff.email,
            userId: finalized.order.createdBy || null,
            organizationId: handoff.organization_id,
            idempotencyKey: `payment-success:${providerPayment.id}:email`,
            data: {
                payer_name: handoff.context?.payerName || "Payer",
                organization_name: organization?.name || "Organization",
                fee_name: handoff.context?.label || "Payment",
                amount: formatPaise(handoff.amountPaise, handoff.currency),
                transaction_id: providerPayment.id,
                payment_method: providerPayment.method || "Razorpay",
                payment_time: new Date().toISOString(),
                portal_url: handoff.return_url,
            },
        }).catch((notificationError) => {
            console.error("[Billing Checkout] Payment captured but success notification failed:", notificationError.message);
        });

        return res.json({
            success: true,
            data: {
                transactionId: finalized.transaction._id,
                providerPaymentId: providerPayment.id,
                return_url: handoff.return_url,
            },
        });
    } catch (error) {
        return checkoutError(res, error);
    }
});

export default router;
