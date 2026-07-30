import mongoose from "mongoose";
import { SUBSCRIPTION_CHANGE_REASON } from "../utils/billing.utils.js";

const subscriptionChangeSchema = new mongoose.Schema(
    {
        organizationSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationSubscription",
            required: true,
        },
        reason: {
            type: String,
            enum: Object.values(SUBSCRIPTION_CHANGE_REASON),
            required: true,
        },
        oldStateSnapshot: {
            type: mongoose.Schema.Types.Mixed, // The subscription state before the change
        },
        newStateSnapshot: {
            type: mongoose.Schema.Types.Mixed, // The subscription state after the change
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // e.g. which module was added, previous billing cycle, etc
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

subscriptionChangeSchema.index({ organizationSubscriptionId: 1, createdAt: -1 });

export default mongoose.models.SubscriptionChange || mongoose.model("SubscriptionChange", subscriptionChangeSchema);
