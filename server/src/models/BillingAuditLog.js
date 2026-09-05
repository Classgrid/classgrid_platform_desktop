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

const billingAuditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Can be null if system action
            default: null,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null, // Global actions won't have an org attached
        },
        entityType: { // e.g. "BillingPlan", "OrganizationSubscription", "Invoice"
            type: String,
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        action: { // e.g. "CREATED", "UPDATED", "DELETED", "MANUAL_RECONCILIATION"
            type: String,
            required: true,
        },
        reason: {
            type: String,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        requestId: {
            type: String, // Correlation ID from the incoming request
            default: null,
        },
        oldState: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        newState: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

billingAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.models.BillingAuditLog || mongoose.model("BillingAuditLog", billingAuditLogSchema);
