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

const classroomMembershipSchema = new mongoose.Schema(
    {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        // When the student requested to join
        requestedAt: {
            type: Date,
            default: Date.now,
        },

        // When the teacher approved/rejected
        respondedAt: {
            type: Date,
            default: null,
        },

        // Teacher who responded
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Optional message from student
        requestMessage: {
            type: String,
            default: "",
            maxlength: 300,
        },

        // Optional reason for rejection
        rejectionReason: {
            type: String,
            default: "",
            maxlength: 300,
        },

        // Link back to the structured ERP division
        division_id: {
            type: String, // Supabase UUID
        },
    },
    {
        timestamps: true,
    }
);

// One membership record per student per classroom
classroomMembershipSchema.index(
    { classroom: 1, student: 1 },
    { unique: true }
);

// Fast lookups for teacher dashboard
classroomMembershipSchema.index({ classroom: 1, status: 1 });

// Fast lookups for student's classrooms
classroomMembershipSchema.index({ student: 1, status: 1 });

export default mongoose.model("ClassroomMembership", classroomMembershipSchema);
