import mongoose from "mongoose";

const billingPlanVersionSchema = new mongoose.Schema(
    {
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlan",
            required: true,
        },
        versionNumber: {
            type: Number,
            required: true,
        },
        monthlyBasePricePaise: {
            type: Number,
            required: true,
            min: 0,
        },
        annualBasePricePaise: {
            type: Number,
            required: true,
            min: 0,
        },
        organizationLimit: {
            type: Number, // null/0 means unlimited
            default: null,
        },
        trialPeriodDays: {
            type: Number,
            default: 0,
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveUntil: {
            type: Date,
            default: null, // null means it's the current active version
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

billingPlanVersionSchema.index({ planId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.models.BillingPlanVersion || mongoose.model("BillingPlanVersion", billingPlanVersionSchema);
