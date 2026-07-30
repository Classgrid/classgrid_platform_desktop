import mongoose from "mongoose";

const billingEligibilityRuleSchema = new mongoose.Schema(
    {
        entityType: { // "PLAN" or "MODULE"
            type: String,
            enum: ["PLAN", "MODULE"],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        allowedOrgTypes: {
            type: [String],
            default: [], // Empty means all
        },
        allowedStructureTypes: {
            type: [String],
            default: [], // Empty means all
        },
        allowedDivisionModes: {
            type: [String], // e.g. "with_divisions", "no_divisions"
            default: [], // Empty means all
        },
        requiresSubBatches: {
            type: Boolean,
            default: false,
        },
        excludedOrgTypes: {
            type: [String],
            default: [],
        },
        excludedStructureTypes: {
            type: [String],
            default: [],
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

billingEligibilityRuleSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.BillingEligibilityRule || mongoose.model("BillingEligibilityRule", billingEligibilityRuleSchema);
