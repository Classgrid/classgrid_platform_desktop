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

const feedbackResponseSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeedbackForm",
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function() { return !this.isAnonymous; }
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    answers: [{
        questionId: String,
        questionText: String,
        answer: mongoose.Schema.Types.Mixed,
        rating: Number // Cached for quick averaging
    }],
    comments: {
        type: String,
        trim: true
    },
    // AI-processed comments (neutralized via Groq for anonymity)
    neutralizedComments: {
        type: String,
        trim: true
    },
    metadata: {
        submittedAt: { type: Date, default: Date.now },
        deviceFingerprint: String,
        browser: String
    }
}, { timestamps: true });

// Ensure one student can only submit once per form
feedbackResponseSchema.index({ form: 1, student: 1 }, { unique: true, partialFilterExpression: { isAnonymous: false } });

export default mongoose.model("FeedbackResponse", feedbackResponseSchema);
