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
