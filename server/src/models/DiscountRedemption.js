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

import mongoose from "mongoose";

const discountRedemptionSchema = new mongoose.Schema(
    {
        discountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Discount",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice", // Can be null if it's redeemed but invoice generation failed
            default: null,
        },
        amountAppliedPaise: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "REDEEMED", "REVERSED", "FAILED"],
            default: "PENDING",
        },
        redeemedAt: {
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.DiscountRedemption || mongoose.model("DiscountRedemption", discountRedemptionSchema);
