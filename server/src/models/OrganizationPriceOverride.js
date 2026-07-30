import mongoose from "mongoose";

const organizationPriceOverrideSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        billingModuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModule",
            default: null, // If null, applies to base plan override instead
        },
        monthlyPricePaise: {
            type: Number,
            required: true,
            min: 0,
        },
        annualPricePaise: {
            type: Number,
            required: true,
            min: 0,
        },
        reason: {
            type: String,
            default: "",
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveUntil: {
            type: Date,
            default: null,
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

// One active override per module per organization
organizationPriceOverrideSchema.index({ organizationId: 1, billingModuleId: 1, effectiveFrom: -1 });

export default mongoose.models.OrganizationPriceOverride || mongoose.model("OrganizationPriceOverride", organizationPriceOverrideSchema);
