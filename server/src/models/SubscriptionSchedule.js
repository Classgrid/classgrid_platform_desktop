/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";
import { SUBSCRIPTION_CHANGE_REASON } from "../utils/billing.utils.js";

const subscriptionScheduleSchema = new mongoose.Schema(
    {
        organizationSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationSubscription",
            required: true,
        },
        executeAt: {
            type: Date,
            required: true,
        },
        actionType: {
            type: String,
            enum: Object.values(SUBSCRIPTION_CHANGE_REASON),
            required: true,
        },
        actionPayload: {
            type: mongoose.Schema.Types.Mixed, // e.g. { newPlanId: "..." }
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "EXECUTED", "CANCELLED", "FAILED"],
            default: "PENDING",
        },
        executionError: {
            type: String,
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

subscriptionScheduleSchema.index({ status: 1, executeAt: 1 });
subscriptionScheduleSchema.index({ organizationSubscriptionId: 1, status: 1 });

export default mongoose.models.SubscriptionSchedule || mongoose.model("SubscriptionSchedule", subscriptionScheduleSchema);
