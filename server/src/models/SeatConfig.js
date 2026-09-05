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

const seatConfigSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        // Links to AcademicHierarchy (e.g., Branch in Engineering, Standard in School)
        hierarchy_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicHierarchy",
            required: true,
        },
        academic_year: { type: String, required: true }, // e.g. "2024-25"
        
        // Dynamic Matrix
        total_intake: { type: Number, required: true },
        
        // Quota breakdown (Plan 1 & 6 specific, but versatile)
        quotas: [
            {
                name: { type: String, required: true }, // e.g. "CAP", "MANAGEMENT", "TFWS", "RTE"
                capacity: { type: Number, required: true },
                filled: { type: Number, default: 0 },
                waitlist_count: { type: Number, default: 0 },
            }
        ],

        is_active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Uniqueness: One config per hierarchy item per year per organization
seatConfigSchema.index({ organization_id: 1, hierarchy_id: 1, academic_year: 1 }, { unique: true });

export default mongoose.models.SeatConfig || mongoose.model("SeatConfig", seatConfigSchema);
