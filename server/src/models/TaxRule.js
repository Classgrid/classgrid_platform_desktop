import mongoose from "mongoose";

const taxRuleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String, // e.g. "SOFTWARE_SERVICES", "EDUCATION_SERVICES", "HARDWARE"
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "ARCHIVED"],
            default: "ACTIVE",
        },
        activeVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TaxRuleVersion",
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

export default mongoose.models.TaxRule || mongoose.model("TaxRule", taxRuleSchema);
