import express from "express";
import bcrypt from "bcryptjs";
import BillingHandoff from "../models/BillingHandoff.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import Organization from "../models/Organization.js";
import SaasInvoice from "../models/SaasInvoice.js";
import razorpayService from "../services/razorpay.service.js";
import { finalizeCapturedPayment } from "../services/billing-payment-finalization.service.js";
import { sendEmail, sendTemplateEmail } from "../services/aws-ses.service.js";
import { baseTemplate } from "../services/email-templates.service.js";
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
        const { token: rawToken, otp, payerName, payerEmail } = req.body;
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

        const organization = await Organization.findById(handoff.organization_id).lean() || { name: handoff.context?.organizationName || "Organization" };
        const payerName = handoff.context?.payerName || "Payer";
        const orgName = organization?.name || "Organization";
        const amountFormatted = formatPaise(handoff.amountPaise, handoff.currency);
        const paidAt = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

        let attachments = [];
        try {
            const invoice = await SaasInvoice.findById(handoff.referenceId).lean();
            if (invoice) {
                // Generate receipt PDF using PDFKit (no Puppeteer/Chrome needed)
                const PDFDocument = (await import("pdfkit")).default;
                const pdfBuffer = await new Promise((resolve, reject) => {
                    try {
                        const doc = new PDFDocument({ size: "A4", margin: 50 });
                        const buffers = [];
                        doc.on("data", buffers.push.bind(buffers));
                        doc.on("end", () => resolve(Buffer.concat(buffers)));

                        // Header
                        doc.fontSize(22).font("Helvetica-Bold").text("Classgrid", { align: "center" });
                        doc.fontSize(10).font("Helvetica").fillColor("#666").text("Payment Receipt", { align: "center" });
                        doc.moveDown(0.5);
                        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
                        doc.moveDown(1);

                        // Receipt meta
                        doc.fillColor("#333").fontSize(10).font("Helvetica");
                        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 50);
                        doc.text(`Date: ${paidAt} IST`);
                        doc.text(`Payment ID: ${providerPayment.id}`);
                        doc.text(`Method: ${providerPayment.method || "Razorpay"}`);
                        doc.moveDown(1);

                        // Bill To
                        doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("Bill To:");
                        doc.font("Helvetica").fontSize(10).fillColor("#333");
                        doc.text(payerName);
                        doc.text(handoff.email || "");
                        doc.text(orgName);
                        doc.moveDown(1);

                        // Table header
                        const tableTop = doc.y;
                        doc.rect(50, tableTop, 495, 22).fill("#f3f4f6");
                        doc.fillColor("#111").font("Helvetica-Bold").fontSize(10);
                        doc.text("Description", 60, tableTop + 6, { width: 250 });
                        doc.text("Amount", 400, tableTop + 6, { width: 130, align: "right" });

                        // Table row
                        const rowY = tableTop + 28;
                        doc.font("Helvetica").fillColor("#333").fontSize(10);
                        const label = handoff.context?.label || "Classgrid Platform Subscription";
                        doc.text(label, 60, rowY, { width: 250 });
                        doc.text(amountFormatted, 400, rowY, { width: 130, align: "right" });

                        // Subtotal / Total
                        const subtotalY = rowY + 30;
                        doc.moveTo(50, subtotalY).lineTo(545, subtotalY).strokeColor("#ddd").stroke();
                        doc.font("Helvetica-Bold").fillColor("#111");
                        doc.text("Total Paid:", 300, subtotalY + 8, { width: 100, align: "right" });
                        doc.fontSize(13).fillColor("#059669").text(amountFormatted, 400, subtotalY + 8, { width: 130, align: "right" });

                        // Status badge
                        doc.moveDown(3);
                        doc.fontSize(14).fillColor("#059669").font("Helvetica-Bold").text("✓ PAYMENT SUCCESSFUL", { align: "center" });

                        // Footer
                        doc.moveDown(4);
                        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
                        doc.moveDown(0.5);
                        doc.fontSize(8).fillColor("#999").font("Helvetica");
                        doc.text("This is a computer-generated receipt from Classgrid Billing. No signature required.", { align: "center" });
                        doc.text("support@classgrid.in | classgrid.in", { align: "center" });

                        doc.end();
                    } catch (e) { reject(e); }
                });

                attachments.push({
                    filename: `Classgrid_Receipt_${invoice.invoiceNumber}.pdf`,
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

        const compiledHtml = baseTemplate({ content: emailBody, title: emailTitle });

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
