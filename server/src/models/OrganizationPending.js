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

const organizationPendingSchema = new mongoose.Schema(
    {
        institute_name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
        },
        logo_url: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        designation: {
            type: String,
            default: "",
        },
        photo_url: {
            type: String,
            default: "",
        },
        owner_name: {
            type: String,
            required: true,
        },
        owner_email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
        },
        // Legacy status field — kept for backward compat
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        applicationStatus: {
            type: String,
            enum: ["pending_review", "approved", "rejected"],
            default: "pending_review",
        },
        planRequested: {
            type: String,
            enum: ["PAID"],
            default: "PAID",
        },
        paymentRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentRequest",
            default: null,
        },
        transactionId: {
            type: String,
            default: "",
            trim: true,
        },
        paymentScreenshotUrl: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true, // Adds created_at and updated_at
    }
);

export default mongoose.model("OrganizationPending", organizationPendingSchema);
