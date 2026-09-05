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

const examSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        date: {
            type: Date,
            required: true,
        },
        duration_minutes: {
            type: Number,
            required: true,
            min: 1,
        },
        subject_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrgSubject",
            required: true,
        },
        faculty_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // 4x2 DNA Target (Course/Branch/Standard/Division/Batch)
        hierarchy_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicHierarchy",
            required: true,
        },
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        max_marks: {
            type: Number,
            required: true,
            min: 1,
        },
        passing_marks: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["draft", "scheduled", "active", "completed", "archived"],
            default: "draft",
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for tenant isolation and fast querying
examSchema.index({ organization_id: 1, hierarchy_id: 1, date: -1 });
examSchema.index({ faculty_id: 1, date: -1 });
examSchema.index({ subject_id: 1 });

export default mongoose.model("Exam", examSchema);
