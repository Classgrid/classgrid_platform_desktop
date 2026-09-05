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

import mongoose from "mongoose";

const organizationBillingUsageSnapshotSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        billingPeriodStart: {
            type: Date,
            required: true,
        },
        billingPeriodEnd: {
            type: Date,
            required: true,
        },
        metricCode: {
            type: String, // Matches BillingMetricDefinition.code
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        source: {
            type: String, // e.g. "DAILY_AGGREGATION_CRON", "MANUAL_OVERRIDE"
            required: true,
        },
        calculatedAt: {
            type: Date,
            default: Date.now,
        },
        calculationVersion: { // To track multiple recalculations in a month
            type: Number,
            default: 1,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // e.g. data points used for the calculation
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

organizationBillingUsageSnapshotSchema.index({ organizationId: 1, metricCode: 1, billingPeriodStart: 1 });

export default mongoose.models.OrganizationBillingUsageSnapshot || mongoose.model("OrganizationBillingUsageSnapshot", organizationBillingUsageSnapshotSchema);
