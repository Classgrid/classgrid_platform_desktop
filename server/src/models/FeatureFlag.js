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

/**
 * FeatureFlag â€” Kill Switch for any module on the platform.
 * Super Admin can disable "Go Live", "Canteen", "Quiz" etc. globally 
 * or for specific organizations without deploying new code.
 */
const featureFlagSchema = new mongoose.Schema({
    // Unique key for the feature (e.g., "go_live", "canteen", "quiz_manager")
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // Human-readable name
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    module: {
        type: String,
        trim: true,
        default: "platform"
    },
    routePrefixes: [{
        type: String,
        trim: true
    }],
    exemptRoutePrefixes: [{
        type: String,
        trim: true
    }],
    // Global ON/OFF switch
    isEnabled: {
        type: Boolean,
        default: true
    },
    // If globally enabled, you can still disable for specific orgs
    disabledForOrgs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
    }],
    // If globally disabled, you can still enable for specific orgs (beta testing)
    enabledForOrgs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
    }],
    // Which org types can use this feature? Empty = all
    allowedOrgTypes: [{
        type: String,
        enum: ["SCHOOL", "COLLEGE", "COACHING", "JUNIOR_COLLEGE", "DIPLOMA", "CUSTOM"]
    }],
    // Is this a premium-only feature?
    isPremium: {
        type: Boolean,
        default: false
    },
    // Who last modified this flag
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export default mongoose.models.FeatureFlag || 
    mongoose.model("FeatureFlag", featureFlagSchema);
