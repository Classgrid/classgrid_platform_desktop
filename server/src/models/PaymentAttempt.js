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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import { PAYMENT_ATTEMPT_STAGE } from "../utils/billing.utils.js";

const paymentAttemptSchema = new mongoose.Schema(
    {
        paymentOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentOrder",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        stage: {
            type: String,
            enum: Object.values(PAYMENT_ATTEMPT_STAGE),
            default: PAYMENT_ATTEMPT_STAGE.TOKEN_CREATED,
        },
        providerPaymentId: { // Razorpay payment_id (can be null if attempt failed before getting one)
            type: String,
        },
        method: { // e.g. "UPI", "CARD", "NET_BANKING", "WALLET"
            type: String,
            default: null,
        },
        amountPaise: {
            type: Number,
            required: true,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // The user attempting the payment
        }
    },
    {
        timestamps: true,
    }
);

paymentAttemptSchema.index({ paymentOrderId: 1 });
paymentAttemptSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });

export default mongoose.models.PaymentAttempt || mongoose.model("PaymentAttempt", paymentAttemptSchema);
