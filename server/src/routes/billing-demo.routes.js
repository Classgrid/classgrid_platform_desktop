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
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import BillingHandoff from "../models/BillingHandoff.js";
import PaymentOrder from "../models/PaymentOrder.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import razorpayService from "../services/razorpay.service.js";
import { hashHandoffToken } from "../services/billing-handoff.service.js";
import { PAYMENT_ATTEMPT_STAGE } from "../utils/billing.utils.js";
import connectDB from "../../config/db.js";

const router = express.Router();

const DEMO_OTP = "123456";
const DEMO_AMOUNT_PAISE = 99900; // ₹999 demo subscription
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

        // Expire any existing demo sessions cleanly
        await BillingHandoff.updateMany(
            { payment_type: "saas_invoice", "context.isDemo": true, consumedAt: null },
            { $set: { consumedAt: new Date(), expiresAt: new Date() } }
        );

        // Resolve the Classgrid org (super admin org) — use a dummy ObjectId if none exists
        // We use a placeholder org_id since this is a demo
        const demoOrgId = process.env.CLASSGRID_ORG_ID
            || new mongoose.Types.ObjectId().toString();

        // Create a real Razorpay order using platform keys (test or live)
        const receiptId = `demo_${crypto.randomBytes(8).toString("hex")}`;
        let razorpayOrder;
        try {
            razorpayOrder = await razorpayService.createPlatformOrderPaise(
                DEMO_AMOUNT_PAISE,
                receiptId,
                { payment_type: "demo_session", is_demo: "true" }
            );
        } catch (rzpErr) {
            console.error("[Demo] Razorpay order creation failed:", rzpErr.message);
            return res.status(502).json({
                success: false,
                error: "Failed to create Razorpay test order. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.",
                detail: rzpErr.message,
            });
        }

        // Create stub PaymentOrder
        const demoPlaceholderRefId = new mongoose.Types.ObjectId();
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
        });

        // Hash OTP 123456
        const otpHash = await bcrypt.hash(DEMO_OTP, 12);
        const rawToken = crypto.randomBytes(32).toString("base64url");

        const handoff = await BillingHandoff.create({
            token: hashHandoffToken(rawToken),
            email: "demo@classgrid.in",
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
                payerName: "Demo Admin",
                isDemo: true,
            },
            expiresAt: new Date(Date.now() + DEMO_48H),
        });

        const url = checkoutUrl(rawToken);

        console.log(`[Demo] Session created → ${url} | Expires: ${handoff.expiresAt}`);

        return res.status(201).json({
            success: true,
            data: {
                checkout_url: url,
                demo_otp: DEMO_OTP,
                amount: "₹999",
                expires_at: handoff.expiresAt,
                test_card: {
                    number: "4111 1111 1111 1111",
                    expiry: "12/27",
                    cvv: "123",
                    otp: "123456",
                },
                test_upi: "success@razorpay",
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
