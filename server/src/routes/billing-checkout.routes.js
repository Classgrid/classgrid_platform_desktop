import express from "express";
import crypto from "crypto";
import BillingHandoff from "../models/BillingHandoff.js";
import Organization from "../models/Organization.js";

const router = express.Router();

// Verify OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { token, otp } = req.body;
        
        if (!token || !otp) {
            return res.status(400).json({ error: "Token and OTP are required" });
        }

        const handoff = await BillingHandoff.findOne({ token });
        if (!handoff) {
            return res.status(404).json({ error: "Invalid or expired session" });
        }
        
        if (handoff.verified) {
             return res.status(400).json({ error: "Payment already completed" });
        }

        if (handoff.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        const org = await Organization.findById(handoff.organization_id).select("name");

        return res.json({
            razorpay_order_id: handoff.razorpay_order_id,
            razorpay_key_id: handoff.razorpay_key_id,
            amount: handoff.amount,
            currency: handoff.currency,
            organization_id: handoff.organization_id,
            email: handoff.email,
            return_url: handoff.return_url
        });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Confirm Payment
router.post("/confirm", async (req, res) => {
    try {
        const { token, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        if (!token || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: "Missing payment details" });
        }

        const handoff = await BillingHandoff.findOne({ token });
        if (!handoff) {
            return res.status(404).json({ error: "Invalid session" });
        }

        const { default: razorpayService } = await import("../services/razorpay.service.js");
        
        let isSignatureValid = false;
        if (handoff.payment_type === "fee_payment" || handoff.payment_type === "admission_fee") {
             isSignatureValid = await razorpayService.verifySignature(handoff.organization_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, "fees");
        } else if (handoff.payment_type === "canteen_order") {
             isSignatureValid = await razorpayService.verifySignature(handoff.organization_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, "canteen");
        } else {
             isSignatureValid = razorpayService.verifyPlatformSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        }

        if (!isSignatureValid) {
             return res.status(400).json({ error: "Invalid payment signature" });
        }

        // Signature is valid, mark the handoff as verified so they can't reuse it.
        handoff.verified = true;
        await handoff.save();

        res.json({
            success: true,
            return_url: handoff.return_url
        });
    } catch (error) {
        console.error("Confirm Checkout Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
