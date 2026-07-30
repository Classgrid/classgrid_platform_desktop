import mongoose from "mongoose";

const taxRuleVersionSchema = new mongoose.Schema(
    {
        taxRuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TaxRule",
            required: true,
        },
        versionNumber: {
            type: Number,
            required: true,
        },
        taxPercentage: {
            type: Number,
            required: true,
            min: 0,
        },
        igstPercentage: {
            type: Number,
            required: true,
            min: 0,
        },
        cgstPercentage: {
            type: Number,
            required: true,
            min: 0,
        },
        sgstPercentage: {
            type: Number,
            required: true,
            min: 0,
        },
        isTaxInclusive: {
            type: Boolean,
            default: false,
        },
        placeOfSupplyLogic: {
            type: String, // e.g. "INTRA_STATE", "INTER_STATE", "INTERNATIONAL"
            default: "INTRA_STATE",
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
        }
    },
    {
        timestamps: true,
    }
);

taxRuleVersionSchema.index({ taxRuleId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.models.TaxRuleVersion || mongoose.model("TaxRuleVersion", taxRuleVersionSchema);
