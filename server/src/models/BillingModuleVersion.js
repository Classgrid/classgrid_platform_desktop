import mongoose from "mongoose";

const billingModuleVersionSchema = new mongoose.Schema(
    {
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModule",
            required: true,
        },
        versionNumber: {
            type: Number,
            required: true,
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
        taxCategory: {
            type: String, // Maps to TaxRule code or type
            default: "SOFTWARE_SERVICES",
        },
        unitType: {
            type: String, // e.g. "USER", "STUDENT", "GB", "MESSAGE", "FLAT"
            required: true,
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

billingModuleVersionSchema.index({ moduleId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.models.BillingModuleVersion || mongoose.model("BillingModuleVersion", billingModuleVersionSchema);
