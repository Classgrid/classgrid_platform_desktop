import express from "express";
import crypto from "crypto";
import BillingHandoff from "../models/BillingHandoff.js";
import Organization from "../models/Organization.js";
import { sendEmail } from "../services/aws-ses.service.js";
import { razorpay } from "../config/razorpay.js";
import { getTerminology } from "../utils/terminology.js";
import { generalLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/billing/handoff/initiate
 * Called by subdomains (org admin, students, etc.) when they click "Pay".
 * Generates a handoff token, Razorpay order, and sends OTP.
 */
router.post("/initiate", generalLimiter, async (req, res) => {
    try {
        const { 
            amount, 
            currency = "INR", 
            email, 
            organization_id, 
            payment_type, 
            return_url, 
            context 
        } = req.body;

        if (!amount || !email || !organization_id || !payment_type || !return_url) {
            return res.status(400).json({ error: "Missing required fields for billing handoff" });
        }

        const org = await Organization.findById(organization_id).select("name razorpay_key_id fees_razorpay_key_id canteen_config");
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        // Determine which Razorpay account to use for order creation
        let razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        let razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (payment_type === "fee_payment" || payment_type === "admission_fee") {
            if (!org.fees_razorpay_key_id) return res.status(400).json({ error: "Organization has not setup fees payment gateway" });
            razorpayKeyId = org.fees_razorpay_key_id;
            razorpayKeySecret = org.fees_razorpay_key_secret; // Assuming it's populated or we need to fetch the secret
        } else if (payment_type === "canteen_order") {
            if (!org.canteen_config?.canteen_razorpay_key_id) return res.status(400).json({ error: "Organization has not setup canteen payment gateway" });
            razorpayKeyId = org.canteen_config.canteen_razorpay_key_id;
            
            const { decrypt } = await import("../utils/encryption.js");
            razorpayKeySecret = decrypt(org.canteen_config.canteen_razorpay_webhook_secret); // Wait, we need the key_secret, not webhook secret!
            // Actually, for order creation, we need the secret.
            // Let's use razorpayService.createOrder directly since it handles this logic!
        }
        
        const { default: razorpayService } = await import("../services/razorpay.service.js");
        
        // Use razorpayService to generate the order, because it already knows how to route to the correct account!
        const receiptId = `rcpt_${crypto.randomBytes(6).toString("hex")}`;
        const notes = {
            type: payment_type,
            organization_id: organization_id,
            ...context
        };

        let razorpayOrder;
        try {
            razorpayOrder = await razorpayService.createOrder({
                amount: amount,
                currency: currency,
                receipt: receiptId,
                organizationId: organization_id,
                type: payment_type,
                notes: notes
            });
        } catch (error) {
            console.error("[Billing Handoff] Failed to create Razorpay Order:", error);
            return res.status(500).json({ error: "Failed to initiate payment order" });
        }

        // Generate OTP and Handoff Token
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString("hex");

        // We also need to get the correct razorpay_key_id for the frontend to use in checkout
        let frontendKeyId = process.env.RAZORPAY_KEY_ID;
        if ((payment_type === "fee_payment" || payment_type === "admission_fee") && org.fees_razorpay_key_id) {
            frontendKeyId = org.fees_razorpay_key_id;
        } else if (payment_type === "canteen_order" && org.canteen_config?.canteen_razorpay_key_id) {
            frontendKeyId = org.canteen_config.canteen_razorpay_key_id;
        }

        const handoff = await BillingHandoff.create({
            token,
            email,
            otp,
            organization_id,
            razorpay_order_id: razorpayOrder.id,
            amount,
            currency,
            razorpay_key_id: frontendKeyId,
            payment_type,
            return_url,
            context
        });

        // Send OTP via Email
        const terminology = await getTerminology(organization_id);
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Secure Payment Checkout</h2>
                <p>You have initiated a payment of ₹${amount} for ${org.name}.</p>
                <p>To securely complete this checkout, please enter the following verification code:</p>
                <h1 style="background: #f4f4f4; padding: 15px; text-align: center; letter-spacing: 5px; font-size: 32px; color: #333; border-radius: 8px;">${otp}</h1>
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not initiate this payment, you can safely ignore this email.</p>
            </div>
        `;

        await sendEmail(email, "Your Secure Payment Checkout Code", emailHtml, organization_id);

        res.json({
            success: true,
            checkout_url: `https://billing.classgrid.in/checkout?token=${token}`,
            token: token
        });

    } catch (error) {
        console.error("[Billing Handoff Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
