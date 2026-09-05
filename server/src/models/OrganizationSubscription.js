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

const organizationSubscriptionSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
        },
        billingPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlan",
            required: true,
        },
        billingPlanVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            required: true,
        },
        billingCycle: {
            type: String,
            enum: ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"],
            default: "MONTHLY",
        },
        status: {
            type: String,
            enum: ["TRIAL", "ACTIVE", "PAUSED", "SUSPENDED", "CANCELLED"],
            default: "ACTIVE",
        },
        currentPeriodStart: {
            type: Date,
            required: true,
        },
        currentPeriodEnd: {
            type: Date,
            required: true,
        },
        trialEndsAt: {
            type: Date,
            default: null,
        },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        providerSubscriptionId: { // Razorpay Sub ID
            type: String,
            default: null,
        },
        providerCustomerId: { // Razorpay Customer ID
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.OrganizationSubscription || mongoose.model("OrganizationSubscription", organizationSubscriptionSchema);
