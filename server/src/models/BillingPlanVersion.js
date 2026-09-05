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

const billingPlanVersionSchema = new mongoose.Schema(
    {
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlan",
            required: true,
        },
        versionNumber: {
            type: Number,
            required: true,
        },
        monthlyBasePricePaise: {
            type: Number,
            required: true,
            min: 0,
        },
        annualBasePricePaise: {
            type: Number,
            required: true,
            min: 0,
        },
        organizationLimit: {
            type: Number, // null/0 means unlimited
            default: null,
        },
        trialPeriodDays: {
            type: Number,
            default: 0,
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveUntil: {
            type: Date,
            default: null, // null means it's the current active version
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

billingPlanVersionSchema.index({ planId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.models.BillingPlanVersion || mongoose.model("BillingPlanVersion", billingPlanVersionSchema);
