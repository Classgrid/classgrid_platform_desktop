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

const organizationSubscriptionItemSchema = new mongoose.Schema(
    {
        organizationSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationSubscription",
            required: true,
        },
        billingModuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModule",
            required: true,
        },
        billingModuleVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModuleVersion",
            required: true,
        },
        quantity: { // Used for PER_USER or PER_CAMPUS if static. Usually 1 for standard usage tracking.
            type: Number,
            default: 1,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "PAUSED", "CANCELLED"],
            default: "ACTIVE",
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveUntil: {
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

organizationSubscriptionItemSchema.index({ organizationSubscriptionId: 1, billingModuleId: 1 }, { unique: true });

export default mongoose.models.OrganizationSubscriptionItem || mongoose.model("OrganizationSubscriptionItem", organizationSubscriptionItemSchema);
