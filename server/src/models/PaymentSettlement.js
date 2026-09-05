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

const paymentSettlementSchema = new mongoose.Schema(
    {
        providerSettlementId: { // Razorpay settlement_id
            type: String,
            required: true,
            unique: true,
        },
        merchantOrganizationId: { // The org that received the money
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        amountSettledPaise: { // Actual money hitting the bank
            type: Number,
            required: true,
        },
        feesTotalPaise: { // Razorpay fees + platform fees
            type: Number,
            required: true,
        },
        taxTotalPaise: { // Tax on fees
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["CREATED", "PROCESSED", "FAILED"],
            default: "CREATED",
        },
        utr: { // Bank UTR (Unique Transaction Reference)
            type: String,
            default: null,
        },
        settledAt: { // Timestamp from the webhook when it hit the bank
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

paymentSettlementSchema.index({ providerSettlementId: 1 }, { unique: true });
paymentSettlementSchema.index({ status: 1, settledAt: 1 });

export default mongoose.models.PaymentSettlement || mongoose.model("PaymentSettlement", paymentSettlementSchema);
