/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
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
