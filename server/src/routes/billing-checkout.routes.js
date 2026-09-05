/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import express from "express";
import bcrypt from "bcryptjs";
import BillingHandoff from "../models/BillingHandoff.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import Organization from "../models/Organization.js";
import SaasInvoice from "../models/SaasInvoice.js";
import PaymentCounter from "../models/PaymentCounter.js";
import { detectFraud, parseUserAgent } from "../services/fraud.service.js";
import razorpayService from "../services/razorpay.service.js";
import { finalizeCapturedPayment } from "../services/billing-payment-finalization.service.js";
import { sendEmail, sendTemplateEmail } from "../services/aws-ses.service.js";
import { baseTemplate } from "../services/email-templates.service.js";
import { generateInvoicePdfBuffer } from "../services/pdf-invoice.service.js";
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

function activeTokenQuery(rawToken, req) {
    return {
        token: { $in: handoffTokenCandidates(rawToken) },
        verified: false,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        clientIp: req.ip,
        userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    };
}

router.get("/session", async (req, res) => {
    try {
        const rawToken = req.query.token;
        if (!rawToken) return res.status(400).json({ success: false, error: "Token is required" });
        const handoff = await BillingHandoff.findOne(activeTokenQuery(rawToken, req)).lean();
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
        const { token: rawToken, otp, payerName, payerEmail } = req.body;
        if (!rawToken || !/^\d{6}$/.test(String(otp || ""))) {
            return res.status(400).json({ success: false, error: "A valid token and 6-digit OTP are required" });
        }

        const handoff = await BillingHandoff.findOne(activeTokenQuery(rawToken, req)).select("+token +otp");
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

        // Save user-provided name/email into context and email field
        const updateFields = {
            otp: "CONSUMED",
            otpVerifiedAt: new Date(),
            attempts: 0,
            lockoutUntil: null,
        };
        if (payerName) updateFields["context.payerName"] = payerName.trim();
        if (payerEmail) updateFields.email = payerEmail.trim();

        const verified = await BillingHandoff.findOneAndUpdate(
            { _id: handoff._id, otpVerifiedAt: null, consumedAt: null, verified: false },
            { $set: updateFields },
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
            ...activeTokenQuery(rawToken, req),
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

        const organization = await Organization.findById(handoff.organization_id).lean() || { name: handoff.context?.organizationName || "Organization" };
        const payerName = handoff.context?.payerName || "Payer";
        const orgName = organization?.name || "Organization";
        const amountFormatted = formatPaise(handoff.amountPaise, handoff.currency);
        const paidAt = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

        // Atomically increment the training transaction counter in MongoDB
        const counter = await PaymentCounter.findOneAndUpdate(
            { key: "demo_training_count" },
            { $inc: { count: 1 }, $set: { lastUpdatedAt: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        const txNumber = counter.count;
        const txTarget = counter.target || 500;

        // Lookup payer's IP for Attempt Details in admin email
        const payerIp = req.ip || "Unknown";
        const payerDevice = parseUserAgent(req.headers["user-agent"]);
        let payerLocation = "Unknown Location";
        let payerIsp = "Unknown ISP";
        try {
            const ipInfo = await detectFraud(payerIp);
            payerLocation = `${ipInfo.city || "Unknown City"}, ${ipInfo.country || "Unknown Country"}`;
            payerIsp = ipInfo.isp || "Unknown ISP";
        } catch (_) { /* non-critical, ignore */ }
        const attemptTime = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST';

        let attachments = [];
        try {
            const invoice = await SaasInvoice.findById(handoff.referenceId).lean();
            if (invoice) {
                const pdfBuffer = await generateInvoicePdfBuffer(invoice, organization);

                attachments.push({
                    filename: `Classgrid_Invoice_${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                });
                console.log(`[Billing Checkout] ✅ PDF receipt generated: ${invoice.invoiceNumber} (${pdfBuffer.length} bytes)`);
            } else {
                console.warn("[Billing Checkout] No invoice found for referenceId:", handoff.referenceId);
            }
        } catch (err) {
            console.error("[Billing Checkout] Failed to generate PDF for email attachment:", err.message, err.stack);
        }

        // Send a direct confirmation email (no template dependency)
        const emailTitle = `Payment Successful — ${amountFormatted} | Classgrid`;
        const adminEmailTitle = `✅ Transaction #${txNumber} of ${txTarget} — ${amountFormatted} | Classgrid`;
        const emailBody = `
            <p>Hello ${payerName},</p>
            <p>Your payment to <strong>${orgName}</strong> was completed successfully through Classgrid.</p>
            <table style="border-collapse:collapse;width:100%;max-width:420px;margin:16px 0;">
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Amount Paid</td><td style="padding:6px 12px;color:#059669;font-weight:700;">${amountFormatted}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:6px 12px;font-weight:600;color:#374151;">Payment ID</td><td style="padding:6px 12px;font-family:monospace;">${providerPayment.id}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Payment Method</td><td style="padding:6px 12px;">${providerPayment.method || "Razorpay"}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:6px 12px;font-weight:600;color:#374151;">Paid At</td><td style="padding:6px 12px;">${paidAt} IST</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Organization</td><td style="padding:6px 12px;">${orgName}</td></tr>
            </table>
            <p>Your subscription remains active. Keep this email for your records.</p>
            <p style="color:#9ca3af;font-size:12px;">This is an automated receipt from Classgrid Billing.</p>
        `;

        const adminEmailBody = `
            <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin-bottom:20px;border-radius:4px;">
                <p style="margin:0;font-size:18px;font-weight:700;color:#15803d;">Transaction #${txNumber} of ${txTarget}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#166534;">${txTarget - txNumber} more transactions needed to complete the training dataset.</p>
            </div>
            <p>Hello Nikhil,</p>
            <p>A new payment was successfully processed. Here are the details:</p>
            <table style="border-collapse:collapse;width:100%;max-width:420px;margin:16px 0;">
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Training Progress</td><td style="padding:6px 12px;color:#059669;font-weight:700;">#${txNumber} / ${txTarget}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:6px 12px;font-weight:600;color:#374151;">Amount Paid</td><td style="padding:6px 12px;color:#059669;font-weight:700;">${amountFormatted}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Payment ID</td><td style="padding:6px 12px;font-family:monospace;">${providerPayment.id}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:6px 12px;font-weight:600;color:#374151;">Payment Method</td><td style="padding:6px 12px;">${providerPayment.method || "Razorpay"}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Paid At</td><td style="padding:6px 12px;">${paidAt} IST</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:6px 12px;font-weight:600;color:#374151;">Payer</td><td style="padding:6px 12px;">${payerName} (${handoff.email})</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;color:#374151;">Organization</td><td style="padding:6px 12px;">${orgName}</td></tr>
            </table>

            <div style="margin-top:20px;border-top:2px dashed #e5e7eb;padding-top:16px;">
                <h3 style="margin:0 0 10px 0;font-size:14px;color:#111827;">Attempt Details</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:5px 0;font-weight:600;color:#4b5563;width:35%;">Device</td><td style="padding:5px 0;color:#111827;">${payerDevice}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#4b5563;">Location</td><td style="padding:5px 0;color:#111827;">${payerLocation}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#4b5563;">IP Address</td><td style="padding:5px 0;color:#111827;font-family:monospace;">${payerIp} (${payerIsp})</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#4b5563;">Time</td><td style="padding:5px 0;color:#111827;">${attemptTime}</td></tr>
                </table>
            </div>

            ${txNumber >= txTarget ? `<p style="color:#15803d;font-weight:bold;font-size:16px;margin-top:20px;">🎉 500 transactions complete! You can now run train_model.py to train the XGBoost model.</p>` : ""}
        `;

        const compiledHtml = baseTemplate({ content: emailBody, title: emailTitle });
        const adminCompiledHtml = baseTemplate({ content: adminEmailBody, title: adminEmailTitle });

        // Send receipt to user
        await sendEmail({
            to: handoff.email,
            subject: emailTitle,
            fromName: "Classgrid Billing",
            fromEmail: "billing@classgrid.in",
            html: compiledHtml,
            attachments,
            userId: finalized.order.createdBy || null,
            organizationId: handoff.organization_id,
        }).catch((emailErr) => {
            console.warn("[Billing Checkout] Payment captured but confirmation email failed:", emailErr.message);
        });

        // Send separate admin notification with transaction counter
        sendEmail({
            to: "nikhil.shinde@classgrid.in",
            subject: adminEmailTitle,
            fromName: "Classgrid Billing",
            fromEmail: "billing@classgrid.in",
            html: adminCompiledHtml,
        }).catch((emailErr) => {
            console.warn("[Billing Checkout] Admin notification email failed:", emailErr.message);
        });

        console.log(`[Billing Checkout] 📊 Training counter: ${txNumber}/${txTarget}`);

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
