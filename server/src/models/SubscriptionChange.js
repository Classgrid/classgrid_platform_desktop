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
import { SUBSCRIPTION_CHANGE_REASON } from "../utils/billing.utils.js";

const subscriptionChangeSchema = new mongoose.Schema(
    {
        organizationSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationSubscription",
            required: true,
        },
        reason: {
            type: String,
            enum: Object.values(SUBSCRIPTION_CHANGE_REASON),
            required: true,
        },
        oldStateSnapshot: {
            type: mongoose.Schema.Types.Mixed, // The subscription state before the change
        },
        newStateSnapshot: {
            type: mongoose.Schema.Types.Mixed, // The subscription state after the change
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // e.g. which module was added, previous billing cycle, etc
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true,
    }
);

subscriptionChangeSchema.index({ organizationSubscriptionId: 1, createdAt: -1 });

export default mongoose.models.SubscriptionChange || mongoose.model("SubscriptionChange", subscriptionChangeSchema);
