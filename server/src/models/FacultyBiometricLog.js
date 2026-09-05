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

import mongoose from "mongoose";

const facultyBiometricLogSchema = new mongoose.Schema(
    {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
        },
        log_type: {
            type: String,
            enum: ["IN", "OUT", "UNKNOWN"],
            default: "UNKNOWN",
        },
        device_id: {
            type: String,
            default: "Unknown Device",
        },
        // Used to prevent multiple logs for the same minute span from the device
        deduplication_hash: {
            type: String,
            required: true,
            unique: true,
        },
        // Status of payroll processing
        processed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

facultyBiometricLogSchema.index({ organization: 1, faculty: 1, timestamp: -1 });

export default mongoose.models.FacultyBiometricLog ||
    mongoose.model("FacultyBiometricLog", facultyBiometricLogSchema);
