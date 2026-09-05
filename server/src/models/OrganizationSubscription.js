/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const organizationSubscriptionSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
        },
        billingPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlan",
            required: true,
        },
        billingPlanVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            required: true,
        },
        billingCycle: {
            type: String,
            enum: ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"],
            default: "MONTHLY",
        },
        status: {
            type: String,
            enum: ["TRIAL", "ACTIVE", "PAUSED", "SUSPENDED", "CANCELLED"],
            default: "ACTIVE",
        },
        currentPeriodStart: {
            type: Date,
            required: true,
        },
        currentPeriodEnd: {
            type: Date,
            required: true,
        },
        trialEndsAt: {
            type: Date,
            default: null,
        },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        providerSubscriptionId: { // Razorpay Sub ID
            type: String,
            default: null,
        },
        providerCustomerId: { // Razorpay Customer ID
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.OrganizationSubscription || mongoose.model("OrganizationSubscription", organizationSubscriptionSchema);
