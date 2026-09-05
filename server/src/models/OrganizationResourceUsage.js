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

const organizationResourceUsageSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        provider: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        providerLabel: {
            type: String,
            required: true,
            trim: true,
        },
        resourceType: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        metricKey: {
            type: String,
            required: true,
            trim: true,
        },
        metricLabel: {
            type: String,
            required: true,
            trim: true,
        },
        usageAmount: {
            type: Number,
            default: null,
        },
        unit: {
            type: String,
            default: "count",
            trim: true,
        },
        costAmount: {
            type: Number,
            default: null,
        },
        currency: {
            type: String,
            default: "INR",
            trim: true,
            uppercase: true,
        },
        quality: {
            type: String,
            enum: ["actual", "partial", "estimated", "manual", "unavailable"],
            default: "actual",
        },
        source: {
            type: String,
            required: true,
            trim: true,
        },
        periodStart: {
            type: Date,
            default: null,
            index: true,
        },
        periodEnd: {
            type: Date,
            default: null,
        },
        lastSyncedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

organizationResourceUsageSchema.index({ orgId: 1, provider: 1, metricKey: 1, periodStart: 1 });

export default mongoose.models.OrganizationResourceUsage ||
    mongoose.model("OrganizationResourceUsage", organizationResourceUsageSchema);
