import express from "express";
import crypto from "crypto";
import connectDB from "../../config/db.js";
import Razorpay from "razorpay";
import { detectFraud, FRAUD_ADMIN_EMAIL, buildFraudAlertHtml, buildUserFraudAlertHtml, parseUserAgent } from "../services/fraud.service.js";
import { sendEmail } from "../services/aws-ses.service.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// RAZORPAY UNIVERSAL WEBHOOK
// POST /api/webhooks/razorpay
//
// This is the single centralized Razorpay webhook for billing.classgrid.in
// It handles ALL payment events across the platform:
//   1. Platform SaaS invoice payments (org → Classgrid)
//   2. Student fee payments (student → org)
//   3. Admission fee payments
//   4. Canteen payments
//   5. Marketplace purchases
//
// Razorpay sends: payment.authorized, payment.captured,
//                 payment.failed, order.paid, refund.created
// ─────────────────────────────────────────────────────────────────

/**
 * Verify Razorpay webhook signature using HMAC SHA256
 */
function verifyRazorpaySignature(rawBody, signature, secret) {
    if (!signature || !secret) return false;
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
    return expectedSignature === signature;
}

// Use raw body for signature verification
router.post("/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
    try {
        const rawBody = req.body; // Buffer because of express.raw()
        const signature = req.headers["x-razorpay-signature"];

        // ── 1. Parse body strictly to get routing info (we verify signature right after) ──
        const body = JSON.parse(rawBody.toString("utf8"));
        const event = body.event;
        const payload = body.payload;
        
        const paymentEntity = payload?.payment?.entity;
        const orderEntity = payload?.order?.entity;
        const refundEntity = payload?.refund?.entity;
        
        const notes = paymentEntity?.notes || orderEntity?.notes || refundEntity?.notes || {};
        const paymentType = notes?.type || "unknown";
        const organizationId = notes?.organization_id || notes?.orgId || req.query.organizationId || null;

        await connectDB();
        
        // ── 2. Determine which secret to use and Verify Signature ──
        let isValid = false;
        
        // Try platform secret first
        const platformSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
        if (verifyRazorpaySignature(rawBody, signature, platformSecret)) {
            isValid = true;
        } 
        // If not platform, try organization secrets
        else if (organizationId) {
            const Organization = (await import("../models/Organization.js")).default;
            const org = await Organization.findById(organizationId).select("fees_razorpay_webhook_secret canteen_config").lean();
            
            if (org) {
                // Try Fees Webhook Secret
                if (org.fees_razorpay_webhook_secret && verifyRazorpaySignature(rawBody, signature, org.fees_razorpay_webhook_secret)) {
                    isValid = true;
                }
                // Try Canteen Webhook Secret (needs decryption)
                else if (org.canteen_config?.canteen_razorpay_webhook_secret) {
                    const { decrypt } = await import("../utils/encryption.js");
                    const canteenSecret = decrypt(org.canteen_config.canteen_razorpay_webhook_secret);
                    if (canteenSecret && verifyRazorpaySignature(rawBody, signature, canteenSecret)) {
                        isValid = true;
                    }
                }
            }
        }

        if (!isValid) {
            console.error("[Razorpay Webhook] ❌ Invalid signature");
            return res.status(401).json({ error: "Invalid webhook signature" });
        }

        console.log(`[Razorpay Webhook] ✅ Event received: ${event} | Type: ${paymentType}`);

        // Lazy-load models to avoid circular dependencies
        const PlatformTransaction = (await import("../models/PlatformTransaction.js")).default;
        const SaasInvoice = (await import("../models/SaasInvoice.js")).default;
        const FeeTransaction = (await import("../models/FeeTransaction.js")).default;
        const OrgSubscription = (await import("../models/OrgSubscription.js")).default;
        const WebhookEvent = (await import("../models/WebhookEvent.js")).default;
        const mongoose = (await import("mongoose")).default;

        // ── 3. Idempotency Lock via WebhookEvent ──
        const eventId = req.headers["x-razorpay-event-id"] || crypto.randomUUID();
        try {
            await WebhookEvent.create({
                provider: "RAZORPAY",
                providerEventId: eventId,
                eventType: event,
                payloadHash: crypto.createHash("sha256").update(rawBody).digest("hex"),
                signatureValid: true,
                payload: body,
                processingStatus: "PENDING"
            });
        } catch (err) {
            if (err.code === 11000) {
                console.log(`[Razorpay Webhook] 🔁 Duplicate event ignored: ${eventId}`);
                return res.status(200).json({ received: true, duplicate: true });
            }
            throw err;
        }

        let processingStatus = "PROCESSED";
        let lastError = null;

        try {
            switch (event) {

            // ═══════════════════════════════════════════
            // PAYMENT CAPTURED — Money received successfully
            // ═══════════════════════════════════════════
            case "payment.captured":
            case "payment.authorized": {
                if (!paymentEntity) break;

                const { id: paymentId, order_id: orderId, amount, currency, notes, method, email, contact } = paymentEntity;
                const amountInr = amount / 100; // Razorpay sends in paise
                const payerName = notes?.payerName || "Unknown Name";

                console.log(`[Razorpay Webhook] 💰 Payment ${event}: ₹${amountInr} | Email: ${email || 'N/A'} | Phone: ${contact || 'N/A'} | Order: ${orderId}`);

                // Check if this payment was already processed (e.g. authorized vs captured)
                const PlatformTransaction = (await import("../models/PlatformTransaction.js")).default;
                const existingTxn = await PlatformTransaction.findOne({ razorpayPaymentId: paymentId });
                if (existingTxn) {
                    console.log(`[Razorpay Webhook] Payment ${paymentId} already processed (Status: ${existingTxn.status}), skipping duplicate fraud check.`);
                    break; // Skip everything, we already handled this payment
                }

                // Determine payment type from notes
                const invoiceId = notes?.invoice_id || notes?.invoiceId || null;
                const studentId = notes?.student_id || notes?.studentId || null;
                const feeRecordId = notes?.fee_record_id || notes?.feeRecordId || null;

                // ── FRAUD DETECTION LAYER ──
                let isFraudulent = false;
                try {
                    const PaymentAttempt = (await import("../models/PaymentAttempt.js")).default;
                    // Find the most recent payment attempt for this order to get the IP address
                    const PaymentOrder = (await import("../models/PaymentOrder.js")).default;
                    const pOrder = await PaymentOrder.findOne({ providerOrderId: orderId }).select("_id").lean();
                    
                    let payerIp = null;
                    let payerUserAgent = null;
                    if (pOrder) {
                        const attempt = await PaymentAttempt.findOne({ paymentOrderId: pOrder._id }).sort({ createdAt: -1 }).lean();
                        payerIp = attempt?.ipAddress;
                        payerUserAgent = attempt?.userAgent;
                    }

                    if (payerIp) {
                        const fraudCheck = await detectFraud(payerIp);
                        if (fraudCheck.isFraud) {
                            isFraudulent = true;
                            console.error(`[Fraud Engine] 🚨 FRAUD DETECTED! Blocking payment ${paymentId}. Score: ${fraudCheck.score}`);
                            
                            // 1. Auto Refund via Razorpay API
                            try {
                                const rzp = new Razorpay({
                                    key_id: process.env.RAZORPAY_KEY_ID,
                                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                                });
                                await rzp.payments.refund(paymentId, {
                                    amount: amount, // amount is in paise
                                    notes: { reason: "Fraud Detection Engine Block" }
                                });
                                console.log(`[Fraud Engine] ✅ Refund issued for blocked payment ${paymentId}`);
                            } catch (refundErr) {
                                console.error("[Fraud Engine] ❌ Auto-refund failed:", refundErr.message);
                            }

                            // 2. Send Fraud Alert Email to Admin
                            try {
                                const fraudHtml = buildFraudAlertHtml({
                                    ip: fraudCheck.ip,
                                    country: fraudCheck.country,
                                    isp: fraudCheck.isp,
                                    score: fraudCheck.score,
                                    reason: fraudCheck.reason,
                                    amount: `₹${amountInr}`,
                                    paymentId,
                                    payerEmail: email || "N/A",
                                    paidAt: new Date().toLocaleString(),
                                    device: parseUserAgent(payerUserAgent),
                                    location: `${fraudCheck.city || 'Unknown City'}, ${fraudCheck.country || 'Unknown Country'}`,
                                    time: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST'
                                });

                                await sendEmail({
                                    to: FRAUD_ADMIN_EMAIL,
                                    subject: `🚨 FRAUD ALERT — Suspicious Payment Blocked (Score: ${(fraudCheck.score * 100).toFixed(0)}%)`,
                                    html: fraudHtml,
                                    fromName: "Classgrid Security",
                                    fromEmail: "security@classgrid.in"
                                });
                                console.log(`[Fraud Engine] ✅ Alert email sent to ${FRAUD_ADMIN_EMAIL}`);
                                
                                if (email) {
                                    const userFraudHtml = buildUserFraudAlertHtml({
                                        amount: `₹${amountInr}`,
                                        paymentId,
                                        paidAt: new Date().toLocaleString(),
                                        device: parseUserAgent(payerUserAgent),
                                        location: `${fraudCheck.city || 'Unknown City'}, ${fraudCheck.country || 'Unknown Country'}`,
                                        ip: fraudCheck.ip,
                                        isp: fraudCheck.isp,
                                        time: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST'
                                    });
                                    await sendEmail({
                                        to: email,
                                        subject: `Payment Declined — Security Alert`,
                                        html: userFraudHtml,
                                        fromName: "Classgrid Security",
                                        fromEmail: "security@classgrid.in"
                                    });
                                    console.log(`[Fraud Engine] ✅ User alert email sent to ${email}`);
                                }
                            } catch (emailErr) {
                                console.error("[Fraud Engine] ❌ Failed to send alert email:", emailErr.message);
                            }

                            // 3. Log the blocked transaction
                            const PlatformTransaction = (await import("../models/PlatformTransaction.js")).default;
                            await PlatformTransaction.create({
                                organizationId: organizationId || null,
                                type: "razorpay",
                                amount: amountInr,
                                currency,
                                status: "failed", // Mark as failed due to fraud
                                razorpayOrderId: orderId,
                                razorpayPaymentId: paymentId,
                                note: `BLOCKED BY FRAUD ENGINE | Score: ${fraudCheck.score} | Reason: ${fraudCheck.reason}`,
                            });

                            // End processing for this webhook — do not generate receipts or activate plans
                            break;
                        }
                    } else {
                        console.log(`[Fraud Engine] No IP found for order ${orderId}, skipping check`);
                    }
                } catch (fraudErr) {
                    console.error("[Fraud Engine] Error during fraud check:", fraudErr.message);
                }

                // ── Platform SaaS Payment ──
                if (paymentType === "saas_invoice" || paymentType === "platform" || invoiceId) {
                    // Check for duplicate
                    const existing = await PlatformTransaction.findOne({ razorpayPaymentId: paymentId });
                    if (existing) {
                        console.log(`[Razorpay Webhook] Duplicate payment ${paymentId}, skipping`);
                        break;
                    }

                    // Log the transaction
                    const platformTxn = await PlatformTransaction.create({
                        organizationId,
                        type: "razorpay",
                        amount: amountInr,
                        currency,
                        status: "success",
                        razorpayOrderId: orderId,
                        razorpayPaymentId: paymentId,
                        planActivated: "active",
                        note: `Razorpay webhook: ${event} | Method: ${method} | Email: ${email}`,
                    });

                    // RULE 6 ENFORCEMENT: Audit Log
                    const { logAdminAction } = await import("../services/auditLog.service.js");
                    await logAdminAction(
                        req, 
                        "WEBHOOK_EVENT", 
                        "organization", 
                        organizationId, 
                        "Processed platform SaaS payment webhook", 
                        { paymentId, amountInr, orderId, email, contact, payerName }
                    );

                    // Update SaaS Invoice status to paid
                    if (invoiceId) {
                        const session = await mongoose.startSession();
                        session.startTransaction();
                        try {
                            const invoice = await SaasInvoice.findById(invoiceId).session(session);
                            if (invoice && invoice.status !== "paid") {
                                invoice.status = "paid";
                                invoice.paidAt = new Date();
                                invoice.razorpay = {
                                    orderId,
                                    paymentId,
                                    paymentMethod: method,
                                    paidAt: new Date()
                                };
                                await invoice.save({ session });
                            }
                            await session.commitTransaction();
                        } catch (err) {
                            await session.abortTransaction();
                            throw err;
                        } finally {
                            session.endSession();
                        }
                    }

                    // Extend subscription
                    if (organizationId) {
                        const sub = await OrgSubscription.findOne({ organization_id: organizationId });
                        if (sub) {
                            sub.plan = "active";
                            sub.status = "active";
                            sub.isPaid = true;
                            // Extend by 31 days from now or from current expiry (whichever is later)
                            const now = new Date();
                            const currentExpiry = sub.expiresAt ? new Date(sub.expiresAt) : now;
                            const baseDate = currentExpiry > now ? currentExpiry : now;
                            sub.expiresAt = new Date(baseDate.getTime() + 31 * 24 * 60 * 60 * 1000);
                            await sub.save();
                        }
                    }

                    console.log(`[Razorpay Webhook] ✅ Platform payment recorded for org ${organizationId}`);
                }

                // ── Student Fee Payment ──
                else if (paymentType === "fee_payment" || paymentType === "student_fee" || feeRecordId) {
                    const existing = await FeeTransaction.findOne({ razorpay_payment_id: paymentId });
                    if (existing) {
                        console.log(`[Razorpay Webhook] Duplicate fee payment ${paymentId}, skipping`);
                        break;
                    }

                    await FeeTransaction.create({
                        organization_id: organizationId,
                        student_id: studentId,
                        fee_record_id: feeRecordId,
                        amount: amountInr,
                        currency,
                        method: "razorpay",
                        status: "success",
                        razorpay_order_id: orderId,
                        razorpay_payment_id: paymentId,
                        notes: `Webhook: ${event} | ${email || ""} | ${contact || ""}`,
                    });

                    // RULE 6 ENFORCEMENT: Audit Log
                    const { logAdminAction } = await import("../services/auditLog.service.js");
                    await logAdminAction(
                        req, 
                        "WEBHOOK_EVENT", 
                        "organization", 
                        organizationId, 
                        "Processed student fee payment webhook", 
                        { paymentId, studentId, amountInr }
                    );

                    // Update FeeRecord paid amount
                    if (feeRecordId) {
                        const FeeRecord = (await import("../models/FeeRecord.js")).default;
                        const record = await FeeRecord.findById(feeRecordId);
                        if (record) {
                            record.paid_amount = (record.paid_amount || 0) + amountInr;
                            if (record.paid_amount >= record.total_amount) {
                                record.status = "paid";
                            } else {
                                record.status = "partial";
                            }
                            await record.save();
                        }
                    }

                    console.log(`[Razorpay Webhook] ✅ Fee payment recorded: Student ${studentId}, Org ${organizationId}`);
                }

                // ── Admission Fee Payment ──
                else if (paymentType === "admission_fee") {
                    const applicationId = notes?.application_id;
                    if (!applicationId) {
                        console.error("[Razorpay Webhook] Admission fee missing application_id");
                        break;
                    }

                    const AdmissionApplication = (await import("../models/AdmissionApplication.js")).default;
                    const application = await AdmissionApplication.findById(applicationId);

                    if (application && !application.fee_paid) {
                        // Confirm payment and create ledger via Admission Controller helper
                        try {
                            const { handlePaymentWebhook } = await import("../controllers/admission.controller.js");
                            // Re-route the payload to the admission controller's logic by mocking the req object
                            req.body = rawBody; // admission controller expects raw body or parsed body depending on parser, it calls getWebhookRawBody
                            req.query.organizationId = organizationId;
                            // Since admission webhook directly handles it and sends a response, we just invoke it and ignore the res
                            const mockRes = { json: () => {}, status: () => ({ send: () => {} }), send: () => {} };
                            await handlePaymentWebhook(req, mockRes);
                            console.log(`[Razorpay Webhook] ✅ Admission Fee handled via controller for ${applicationId}`);

                            // RULE 6 ENFORCEMENT: Audit Log
                            const { logAdminAction } = await import("../services/auditLog.service.js");
                            await logAdminAction(
                                req, 
                                "WEBHOOK_EVENT", 
                                "organization", 
                                organizationId, 
                                "Processed admission fee payment webhook", 
                                { paymentId, applicationId, amountInr }
                            );
                        } catch (err) {
                            console.error("[Razorpay Webhook] Admission fee handler failed:", err);
                        }
                    } else {
                        console.log(`[Razorpay Webhook] Admission already paid or not found for ${applicationId}`);
                    }
                }

                // ── Canteen Order Payment ──
                else if (paymentType === "canteen_order") {
                    const CanteenOrder = (await import("../models/CanteenOrder.js")).default;
                    const order = await CanteenOrder.findOneAndUpdate(
                        { transactionId: orderId, orgId: organizationId },
                        { status: "NEW", paymentStatus: "SUCCESS" },
                        { returnDocument: 'after' }
                    );

                    if (order) {
                        console.log(`[Razorpay Webhook] ✅ Canteen order ${order.tokenNumber} marked paid`);
                        // Try to emit socket
                        try {
                            const { getIO } = await import("../services/socket.service.js");
                            const io = getIO();
                            io.to(`org_${organizationId}_canteen_kitchen`).emit("canteen_new_order", {
                                orderId: order._id,
                                tokenNumber: order.tokenNumber,
                                items: order.items,
                                totalAmount: order.totalAmount,
                                createdAt: order.createdAt
                            });

                            // RULE 6 ENFORCEMENT: Audit Log
                            const { logAdminAction } = await import("../services/auditLog.service.js");
                            await logAdminAction(
                                req, 
                                "WEBHOOK_EVENT", 
                                "organization", 
                                organizationId, 
                                "Processed canteen order payment webhook", 
                                { paymentId, orderId: order._id, amountInr }
                            );
                        } catch (err) {
                            console.warn("[Razorpay Webhook] Canteen socket emit failed");
                        }
                    } else {
                        console.log(`[Razorpay Webhook] Canteen order for razorpay_order_id ${orderId} not found`);
                    }
                }

                // ── Marketplace Order Payment ──
                else if (paymentType === "marketplace_order") {
                    console.log(`[Razorpay Webhook] ✅ Marketplace order received (No-op as marketplace is direct file access)`);
                }

                // ── Generic/Unknown Payment ──
                else {
                    // Log it anyway so nothing is lost
                    const existing = await PlatformTransaction.findOne({ razorpayPaymentId: paymentId });
                    if (!existing) {
                        await PlatformTransaction.create({
                            organizationId: organizationId || null,
                            type: "razorpay",
                            amount: amountInr,
                            currency,
                            status: "success",
                            razorpayOrderId: orderId,
                            razorpayPaymentId: paymentId,
                            note: `Webhook: ${event} | Type: ${paymentType} | ${email || ""} | Notes: ${JSON.stringify(notes || {})}`,
                        });
                    }
                    console.log(`[Razorpay Webhook] ✅ Generic payment logged: ₹${amountInr}`);
                }

                break;
            }

            // ═══════════════════════════════════════════
            // PAYMENT FAILED
            // ═══════════════════════════════════════════
            case "payment.failed": {
                if (!paymentEntity) break;

                const { id: paymentId, order_id: orderId, amount, notes, error_description, error_code } = paymentEntity;
                const amountInr = amount / 100;
                const organizationId = notes?.organization_id || notes?.orgId || null;

                console.error(`[Razorpay Webhook] ❌ Payment FAILED: ₹${amountInr} | Error: ${error_code} — ${error_description}`);

                await PlatformTransaction.create({
                    organizationId: organizationId || null,
                    type: "razorpay",
                    amount: amountInr,
                    status: "failed",
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    note: `FAILED: ${error_code} — ${error_description}`,
                });

                // RULE 6 ENFORCEMENT: Audit Log
                const { logAdminAction } = await import("../services/auditLog.service.js");
                await logAdminAction(
                    req, 
                    "WEBHOOK_EVENT", 
                    "organization", 
                    organizationId || null, 
                    "Processed failed payment webhook", 
                    { paymentId, amountInr, error_code }
                );

                break;
            }

            // ═══════════════════════════════════════════
            // ORDER PAID (all payments for order captured)
            // ═══════════════════════════════════════════
            case "order.paid": {
                if (!orderEntity) break;
                console.log(`[Razorpay Webhook] 📦 Order fully paid: ${orderEntity.id} | ₹${orderEntity.amount_paid / 100}`);
                // Payment already handled in payment.captured — this is just a confirmation
                break;
            }

            // ═══════════════════════════════════════════
            // REFUND CREATED
            // ═══════════════════════════════════════════
            case "refund.created":
            case "refund.processed": {
                if (!refundEntity) break;

                const { id: refundId, payment_id: paymentId, amount, notes } = refundEntity;
                const amountInr = amount / 100;
                const organizationId = notes?.organization_id || notes?.orgId || null;

                console.log(`[Razorpay Webhook] 🔄 Refund: ₹${amountInr} for payment ${paymentId}`);

                // Find original transaction
                const originalTxn = await PlatformTransaction.findOne({ razorpayPaymentId: paymentId });

                await PlatformTransaction.create({
                    organizationId: organizationId || originalTxn?.organizationId || null,
                    type: "refund",
                    amount: amountInr,
                    status: "refunded",
                    razorpayPaymentId: refundId,
                    razorpayOrderId: originalTxn?.razorpayOrderId || null,
                    refundOf: originalTxn?._id || null,
                    refundReason: notes?.reason || "Razorpay refund",
                    refundedAt: new Date(),
                    note: `Refund of ₹${amountInr} for payment ${paymentId}`,
                });

                // Update original transaction
                if (originalTxn) {
                    originalTxn.status = "refunded";
                    await originalTxn.save();
                }

                // RULE 6 ENFORCEMENT: Audit Log
                const { logAdminAction } = await import("../services/auditLog.service.js");
                await logAdminAction(
                    req, 
                    "WEBHOOK_EVENT", 
                    "organization", 
                    organizationId || originalTxn?.organizationId || null, 
                    "Processed refund webhook", 
                    { refundId, paymentId, amountInr }
                );

                break;
            }

            default:
                console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
        }

        } catch (switchErr) {
            console.error("[Razorpay Webhook] Error processing event:", switchErr);
            processingStatus = "FAILED";
            lastError = switchErr.message;
        }

        // Mark WebhookEvent as processed
        await WebhookEvent.findOneAndUpdate({ providerEventId: eventId }, {
            processingStatus,
            processedAt: new Date(),
            lastError
        });

        // Always return 200 to Razorpay to prevent retries
        res.status(200).json({ received: true, event });
    } catch (err) {
        console.error("[Razorpay Webhook] 🔥 Error:", err);
        // We don't mark WebhookEvent as FAILED here because the try/catch might have thrown before we got the eventId
        // The webhook retry process will handle it.
        res.status(200).json({ received: true, error: "internal" });
    }
});

export default router;
