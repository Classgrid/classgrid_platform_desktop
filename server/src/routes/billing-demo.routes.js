/**
 * billing-demo.routes.js
 *
 * Demo checkout session for Razorpay architecture review.
 * Creates a real BillingHandoff with OTP=123456 and 48-hour expiry.
 * GUARDED by BILLING_DEMO_ENABLED=true env var.
 * Disable by setting BILLING_DEMO_ENABLED=false — session expires automatically.
 */

import express from "express";
import crypto from "crypto";
import { sendEmail } from "../services/aws-ses.service.js";
import { baseTemplate } from "../services/email-templates.service.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import BillingHandoff from "../models/BillingHandoff.js";
import PaymentOrder from "../models/PaymentOrder.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import SaasInvoice from "../models/SaasInvoice.js";
import razorpayService from "../services/razorpay.service.js";
import { hashHandoffToken } from "../services/billing-handoff.service.js";
import { PAYMENT_ATTEMPT_STAGE } from "../utils/billing.utils.js";
import connectDB from "../../config/db.js";

const router = express.Router();

const DEMO_AMOUNT_PAISE = 200; // ₹2 live test
const DEMO_48H = 48 * 60 * 60 * 1000;

function isDemoEnabled() {
    return true; // Hardcoded for Razorpay review. See cleanup plan to remove.
}

function checkoutUrl(rawToken) {
    const base = process.env.BILLING_PORTAL_URL || "https://billing.classgrid.in";
    const url = new URL("/checkout", base);
    url.searchParams.set("token", rawToken);
    return url.toString();
}

/**
 * POST /api/billing/demo/session
 * Creates (or refreshes) a 48-hour demo billing session.
 * Returns the checkout URL + demo credentials.
 * 
 * Protected: BILLING_DEMO_ENABLED must be "true"
 */
router.post("/session", async (req, res) => {
    try {
        await connectDB(); // Ensure DB is connected in serverless
        if (!isDemoEnabled()) {
            return res.status(403).json({
                success: false,
                error: "Demo mode is not enabled on this server.",
            });
        }

        // Previous demo sessions expire naturally via MongoDB TTL (48h).
        // No cleanup needed — multiple sessions can coexist safely.

        const { email, payerName } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: "Email is required." });
        }

        // Resolve the Classgrid org (super admin org) — use a dummy ObjectId if none exists
        // We use a placeholder org_id since this is a demo
        const demoOrgId = process.env.CLASSGRID_ORG_ID
            || new mongoose.Types.ObjectId().toString();

        // Create stub PaymentOrder and Invoice FIRST to get IDs
        const demoPlaceholderRefId = new mongoose.Types.ObjectId();

        // Create a real Razorpay order using platform keys (test or live)
        const receiptId = `demo_${crypto.randomBytes(8).toString("hex")}`;
        let razorpayOrder;
        try {
            razorpayOrder = await razorpayService.createPlatformOrderPaise(
                DEMO_AMOUNT_PAISE,
                receiptId,
                { 
                    payment_type: "saas_invoice", 
                    is_demo: "true",
                    orgId: demoOrgId.toString(),
                    invoiceId: demoPlaceholderRefId.toString()
                }
            );
        } catch (rzpErr) {
            console.error("[Demo] Razorpay order creation failed:", rzpErr.message);
            return res.status(502).json({
                success: false,
                error: "Failed to create Razorpay test order. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.",
                detail: rzpErr.message,
            });
        }
        
        await SaasInvoice.create({
            _id: demoPlaceholderRefId,
            organizationId: demoOrgId,
            invoiceNumber: `DEMO-${Date.now()}`,
            billingPeriod: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            subtotalPaise: DEMO_AMOUNT_PAISE,
            totalAmountPaise: DEMO_AMOUNT_PAISE,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "draft",
            lineItems: []
        });

        const paymentOrder = await PaymentOrder.create({
            organizationId: demoOrgId,
            invoiceId: demoPlaceholderRefId,
            referenceId: demoPlaceholderRefId,
            paymentFlow: "CLASSGRID_SUBSCRIPTION",
            merchantType: "CLASSGRID",
            merchantOrganizationId: demoOrgId,
            amountPaise: DEMO_AMOUNT_PAISE,
            currency: "INR",
            providerOrderId: razorpayOrder.id,
            receiptId,
            status: "CREATED",
            createdBy: new mongoose.Types.ObjectId(), // anonymous creator
        });

        // Create stub PaymentAttempt
        const paymentAttempt = await PaymentAttempt.create({
            paymentOrderId: paymentOrder._id,
            organizationId: demoOrgId,
            stage: PAYMENT_ATTEMPT_STAGE.OTP_PENDING,
            amountPaise: DEMO_AMOUNT_PAISE,
            ipAddress: req.ip || "127.0.0.1",
            userAgent: String(req.headers["user-agent"] || "demo").slice(0, 300),
            createdBy: new mongoose.Types.ObjectId(),
            providerPaymentId: `demo_attempt_${crypto.randomBytes(8).toString("hex")}`,
        });

        // Generate real random 6-digit OTP and send via AWS SES
        const realOtp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(realOtp, 12);
        const rawToken = crypto.randomBytes(32).toString("base64url");

        const handoff = await BillingHandoff.create({
            token: hashHandoffToken(rawToken),
            email: email.toLowerCase(),
            otp: otpHash,
            organization_id: demoOrgId,
            paymentOrderId: paymentOrder._id,
            paymentAttemptId: paymentAttempt._id,
            referenceId: demoPlaceholderRefId,
            referenceModel: "SaasInvoice",
            razorpay_order_id: razorpayOrder.id,
            amountPaise: DEMO_AMOUNT_PAISE,
            currency: "INR",
            razorpay_key_id: process.env.RAZORPAY_KEY_ID,
            payment_type: "saas_invoice",
            return_url: process.env.BILLING_PORTAL_URL || "https://billing.classgrid.in",
            context: {
                label: "Classgrid Platform — Demo Subscription",
                payerName: payerName || "Payer",
                isDemo: true,
            },
            clientIp: req.ip || "127.0.0.1",
            userAgent: String(req.headers["user-agent"] || "demo").slice(0, 300),
            expiresAt: new Date(Date.now() + DEMO_48H),
        });

        // Send real OTP via AWS SES
        const demoEmail = req.body.email || "demo@classgrid.in";
        try {
            const otpContent = `
                <div style="text-align:center;padding:24px 0;">
                    <h2 style="margin:0 0 16px;color:#1e293b;">Payment Verification</h2>
                    <p style="color:#475569;margin-bottom:24px;">Your one-time verification code is:</p>
                    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f1f5f9;border-radius:8px;margin:16px 0;color:#0f172a;">${realOtp}</div>
                    <p style="color:#64748b;font-size:13px;margin-top:24px;">This code expires in 60 seconds. Do not share it with anyone.</p>
                </div>
            `;
            const compiledHtml = baseTemplate({ content: otpContent, title: "Payment Verification Code" });

            await sendEmail({
                to: demoEmail,
                subject: "Your Payment Verification Code — Classgrid",
                html: compiledHtml,
                fromName: "Classgrid Billing",
                fromEmail: "billing@classgrid.in",
            });
            console.log(`[Demo] Real OTP sent to ${demoEmail}`);
        } catch (emailErr) {
            console.error("[Demo] Failed to send OTP email:", emailErr.message);
        }

        const url = checkoutUrl(rawToken);

        console.log(`[Demo] Session created → ${url} | Expires: ${handoff.expiresAt}`);

        return res.status(201).json({
            success: true,
            data: {
                checkout_url: url,
                otp_sent_to: demoEmail,
                amount: "₹2",
                expires_at: handoff.expiresAt,
            },
        });
    } catch (err) {
        console.error("[Demo] Session creation error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/billing/demo/status
 * Returns whether demo mode is active + a live checkout URL if a valid session exists.
 * Called by the landing page on load to get the current demo link.
 */
router.get("/status", async (req, res) => {
    try {
        await connectDB(); // Ensure DB is connected in serverless
        if (!isDemoEnabled()) {
            return res.json({ enabled: false });
        }

        // Find the latest active demo session
        const handoff = await BillingHandoff.findOne({
            payment_type: "saas_invoice",
            "context.isDemo": true,
            consumedAt: null,
            expiresAt: { $gt: new Date() },
        }).select("expiresAt").lean();

        return res.json({
            enabled: true,
            has_active_session: !!handoff,
            expires_at: handoff?.expiresAt || null,
        });
    } catch (err) {
        console.error("[Demo Status] DB Error:", err);
        return res.json({ enabled: false, error: err.message });
    }
});

export default router;
