import mongoose from "mongoose";

const billingMetricDefinitionSchema = new mongoose.Schema(
    {
        code: {
            type: String, // e.g. ACTIVE_LEARNERS, ACTIVE_STAFF, CAMPUSES, VISIBLE_DIVISIONS, NATIVE_BATCHES, SUB_BATCHES, STORAGE_GB, EMAILS_SENT, SMS_SENT, API_REQUESTS
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        unitLabel: { // e.g. "Learner", "GB", "Campus"
            type: String,
            required: true,
        },
        aggregationType: {
            type: String,
            enum: ["SUM", "MAX", "LAST_VALUE", "AVERAGE"], // How to roll up daily data for the month
            default: "MAX",
        },
        supportedOrgTypes: {
            type: [String],
            default: [], // Empty means all
        },
        supportedStructureTypes: {
            type: [String],
            default: [], // Empty means all
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.BillingMetricDefinition || mongoose.model("BillingMetricDefinition", billingMetricDefinitionSchema);
