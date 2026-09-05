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

const facultyPayrollSchema = new mongoose.Schema(
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
        // Period, e.g., "2026-04"
        month: {
            type: String,
            required: true,
        },
        total_working_days: {
            type: Number,
            default: 0,
        },
        present_days: {
            type: Number,
            default: 0,
        },
        absent_days: {
            type: Number,
            default: 0,
        },
        leaves_taken: {
            type: Number,
            default: 0,
        },
        // For hourly workers
        total_hours_worked: {
            type: Number,
            default: 0,
        },
        gross_salary: {
            type: Number,
            default: 0,
        },
        deductions: {
            type: Number,
            default: 0,
        },
        net_salary: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["draft", "locked", "paid"],
            default: "draft",
        },
    },
    { timestamps: true }
);

facultyPayrollSchema.index({ organization: 1, month: 1 });
facultyPayrollSchema.index({ faculty: 1, month: 1 }, { unique: true });

export default mongoose.models.FacultyPayroll ||
    mongoose.model("FacultyPayroll", facultyPayrollSchema);
