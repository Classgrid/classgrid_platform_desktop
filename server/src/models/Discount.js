import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String, // e.g. "SUMMER50", "WELCOME", "SPECIAL_DEAL"
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        discountType: {
            type: String,
            enum: ["PERCENTAGE", "FIXED_AMOUNT"],
            required: true,
        },
        amountPaise: { // Only used if FIXED_AMOUNT
            type: Number,
            default: null,
        },
        percentage: { // Only used if PERCENTAGE
            type: Number,
            default: null,
            min: 0,
            max: 100,
        },
        appliesTo: {
            type: String,
            enum: ["ENTIRE_INVOICE", "SPECIFIC_MODULE", "BASE_PLAN_ONLY"],
            default: "ENTIRE_INVOICE",
        },
        targetModuleId: { // Required if appliesTo is SPECIFIC_MODULE
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModule",
            default: null,
        },
        targetPlanId: { // Optional restriction
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlan",
            default: null,
        },
        maxRedemptionsTotal: {
            type: Number, // null means unlimited
            default: null,
        },
        maxRedemptionsPerOrganization: {
            type: Number,
            default: 1,
        },
        minimumInvoiceAmountPaise: {
            type: Number,
            default: 0,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validUntil: {
            type: Date,
            default: null, // null means never expires
        },
        status: {
            type: String,
            enum: ["ACTIVE", "ARCHIVED", "DEPLETED"],
            default: "ACTIVE",
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

export default mongoose.models.Discount || mongoose.model("Discount", discountSchema);
