/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const planModuleSchema = new mongoose.Schema(
    {
        billingPlanVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            required: true,
        },
        billingModuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModule",
            required: true,
        },
        pricingType: {
            type: String,
            enum: ["FIXED", "PER_USER", "PER_STUDENT", "PER_CAMPUS", "PER_STORAGE_UNIT", "PER_USAGE", "INCLUDED"],
            required: true,
        },
        includedQuantity: {
            type: Number, // Free tier included in the plan before charging
            default: 0,
        },
        monthlyPricePaise: {
            type: Number,
            default: 0,
        },
        annualPricePaise: {
            type: Number,
            default: 0,
        },
        isIncluded: {
            type: Boolean, // Whether it comes by default with the plan
            default: true,
        },
        isOptional: {
            type: Boolean, // Whether the user can opt-out of this module
            default: false,
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

planModuleSchema.index({ billingPlanVersionId: 1, billingModuleId: 1 }, { unique: true });

export default mongoose.models.PlanModule || mongoose.model("PlanModule", planModuleSchema);
