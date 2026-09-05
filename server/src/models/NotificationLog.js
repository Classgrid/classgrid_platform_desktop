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

const notificationLogSchema = new mongoose.Schema(
    {
        organizationId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Organization",
            required: true
        },
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: false // May be null if sent to a parent/guest without a formal user ID
        },
        templateId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "NotificationTemplate"
        },
        type: { 
            type: String, 
            enum: ["EMAIL", "SMS"], 
            required: true 
        },
        recipient: { 
            type: String, 
            required: true 
        },
        status: { 
            type: String, 
            enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "BOUNCED", "COMPLAINED"],
            default: "PENDING"
        },
        providerMessageId: { 
            type: String 
        },
        failureReason: { 
            type: String 
        },
        metadata: { 
            type: mongoose.Schema.Types.Mixed 
        },
        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true
        },
        retryCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Indexes for fast querying in the super admin dashboard
notificationLogSchema.index({ organizationId: 1, createdAt: -1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ recipient: 1 });

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export default NotificationLog;
