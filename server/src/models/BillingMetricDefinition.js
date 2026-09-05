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

const billingMetricDefinitionSchema = new mongoose.Schema(
    {
        code: {
            type: String, // e.g. ACTIVE_LEARNERS, ACTIVE_STAFF, CAMPUSES, VISIBLE_DIVISIONS, NATIVE_BATCHES, SUB_BATCHES, STORAGE_GB, EMAILS_SENT, SMS_SENT, API_REQUESTS
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        unitLabel: { // e.g. "Learner", "GB", "Campus"
            type: String,
            required: true,
        },
        aggregationType: {
            type: String,
            enum: ["SUM", "MAX", "LAST_VALUE", "AVERAGE"], // How to roll up daily data for the month
            default: "MAX",
        },
        supportedOrgTypes: {
            type: [String],
            default: [], // Empty means all
        },
        supportedStructureTypes: {
            type: [String],
            default: [], // Empty means all
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.BillingMetricDefinition || mongoose.model("BillingMetricDefinition", billingMetricDefinitionSchema);
