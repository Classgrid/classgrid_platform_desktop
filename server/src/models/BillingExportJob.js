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

const billingExportJobSchema = new mongoose.Schema(
    {
        exportType: {
            type: String, // e.g. "REVENUE_REPORT", "FAILED_PAYMENTS_REPORT", "INVOICE_BATCH"
            required: true,
        },
        format: {
            type: String, // e.g. "CSV", "EXCEL", "PDF_ZIP"
            required: true,
        },
        filters: {
            type: mongoose.Schema.Types.Mixed, // The query filters used to generate the report
            default: null,
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "EXPIRED"],
            default: "PENDING",
        },
        fileUrl: {
            type: String, // Path to R2 bucket or signed URL
            default: null,
        },
        storageKey: {
            type: String,
            default: null,
            select: false,
        },
        fileName: {
            type: String,
            default: null,
        },
        contentType: {
            type: String,
            default: null,
        },
        sizeBytes: {
            type: Number,
            default: 0,
            min: 0,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date, // Exports shouldn't live forever
            required: true,
        },
        errorDetails: {
            type: String,
            default: null,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.BillingExportJob || mongoose.model("BillingExportJob", billingExportJobSchema);
