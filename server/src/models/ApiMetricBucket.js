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

// ═══════════════════════════════════════════════════════════
//  ApiMetrics — In-memory aggregated request tracking
//  Strategy: Buffer in-process, flush to DB every 60s.
//  Per-route stats are aggregated (not per-request docs) to
//  avoid write pressure at scale.
// ═══════════════════════════════════════════════════════════

const ApiMetricBucketSchema = new mongoose.Schema({
    // e.g. "GET /api/auth/me"
    route: { type: String, required: true },
    method: { type: String, required: true },
    // Hour-level bucketing — one doc per route per hour
    bucket: { type: Date, required: true },   // rounded to hour
    totalRequests: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },   // 2xx
    clientErrCount: { type: Number, default: 0 },   // 4xx
    serverErrCount: { type: Number, default: 0 },   // 5xx
    totalRespTimeMs: { type: Number, default: 0 }, // sum — divide by totalRequests for avg
    // Rolling last-10 failures (capped array)
    recentFailures: [{
        statusCode: Number,
        errorMessage: String,
        timestamp: Date,
        orgId: String,
    }],
    lastFailureAt: { type: Date },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

ApiMetricBucketSchema.index({ route: 1, method: 1, bucket: -1 });
ApiMetricBucketSchema.index({ bucket: -1 });

export default mongoose.models.ApiMetricBucket || mongoose.model("ApiMetricBucket", ApiMetricBucketSchema);
