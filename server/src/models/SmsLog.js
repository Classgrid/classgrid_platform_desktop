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

import mongoose from "mongoose";

const smsLogSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        phoneHash: {
            type: String,
            default: "",
            trim: true,
        },
        purpose: {
            type: String,
            enum: ["admission_otp", "login_otp", "notification", "fee_reminder", "other"],
            default: "other",
            index: true,
        },
        provider: {
            type: String,
            enum: ["aws_sns", "other"],
            default: "aws_sns",
            index: true,
        },
        providerMessageId: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["queued", "sent", "delivered", "failed"],
            required: true,
            index: true,
        },
        segmentCount: {
            type: Number,
            default: 1,
            min: 1,
        },
        sentAt: {
            type: Date,
            default: null,
            index: true,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        failedAt: {
            type: Date,
            default: null,
        },
        error: {
            type: String,
            default: "",
            trim: true,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

smsLogSchema.index({ organizationId: 1, status: 1, sentAt: -1 });
smsLogSchema.index({ providerMessageId: 1 }, { sparse: true });

export default mongoose.models.SmsLog || mongoose.model("SmsLog", smsLogSchema);
