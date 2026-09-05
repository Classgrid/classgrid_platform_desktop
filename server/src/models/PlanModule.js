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

const planModuleSchema = new mongoose.Schema(
    {
        billingPlanVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            required: true,
        },
        billingModuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModule",
            required: true,
        },
        pricingType: {
            type: String,
            enum: ["FIXED", "PER_USER", "PER_STUDENT", "PER_CAMPUS", "PER_STORAGE_UNIT", "PER_USAGE", "INCLUDED"],
            required: true,
        },
        includedQuantity: {
            type: Number, // Free tier included in the plan before charging
            default: 0,
        },
        monthlyPricePaise: {
            type: Number,
            default: 0,
        },
        annualPricePaise: {
            type: Number,
            default: 0,
        },
        isIncluded: {
            type: Boolean, // Whether it comes by default with the plan
            default: true,
        },
        isOptional: {
            type: Boolean, // Whether the user can opt-out of this module
            default: false,
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

planModuleSchema.index({ billingPlanVersionId: 1, billingModuleId: 1 }, { unique: true });

export default mongoose.models.PlanModule || mongoose.model("PlanModule", planModuleSchema);
