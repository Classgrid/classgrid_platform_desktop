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

/**
 * ScheduledNotification — Pre-schedule push notifications for festivals, events, maintenance, etc.
 * Super Admin can set these up once, and they fire automatically every year.
 * 
 * Examples:
 *   - "Happy Diwali! 🪔" → fires every year on Diwali date
 *   - "System Maintenance at 2 AM" → fires once on a specific date
 *   - "Happy Independence Day! 🇮🇳" → fires every Aug 15
 */
const scheduledNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    // Who receives this?
    target: {
        type: String,
        enum: [
            "global",         // ALL users across ALL organizations
            "all_org_admins",  // Only Org Admins
            "all_super_admins", // Only Super Admins
            "all_students",    // Only Students globally
            "all_faculty",     // Only Faculty globally
            "all_department_admins", // Existing HOD users acting as department admins
            "active_orgs",     // Users attached to active organizations
            "specific_org"     // Only a specific organization
        ],
        default: "global"
    },
    // If target is "specific_org", which org?
    targetOrgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null
    },
    // When should it fire?
    scheduledAt: {
        type: Date,
        required: true,
        index: true
    },
    // Does it repeat every year? (For festivals)
    isRecurring: {
        type: Boolean,
        default: false
    },
    // Category for filtering
    category: {
        type: String,
        enum: ["festival", "maintenance", "announcement", "update", "marketing"],
        default: "announcement"
    },
    // Push notification deep link
    deepLink: {
        type: String,
        default: ""
    },
    // Should we also send email along with push?
    sendEmail: {
        type: Boolean,
        default: false
    },
    // Execution status
    status: {
        type: String,
        enum: ["pending", "processing", "sent", "failed", "cancelled"],
        default: "pending"
    },
    sentAt: {
        type: Date,
        default: null
    },
    sentCount: {
        type: Number,
        default: 0
    },
    // Who created this scheduled notification
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

scheduledNotificationSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.models.ScheduledNotification || 
    mongoose.model("ScheduledNotification", scheduledNotificationSchema);
