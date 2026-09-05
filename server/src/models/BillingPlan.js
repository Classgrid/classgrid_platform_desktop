/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const billingPlanSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["DRAFT", "SCHEDULED", "ACTIVE", "ARCHIVED"],
            default: "DRAFT",
        },
        allowedOrgTypes: {
            type: [String],
            default: [], // Empty means applies to all org_types
        },
        allowedStructureTypes: {
            type: [String],
            default: [], // Empty means applies to all structure_types
        },
        activeVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            default: null,
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

export default mongoose.models.BillingPlan || mongoose.model("BillingPlan", billingPlanSchema);
