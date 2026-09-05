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

const quizSchema = new mongoose.Schema(
    {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
        noteId: {
            type: String, // Supabase note ID
            required: true,
        },
        noteTitle: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // --- Day 17.5: Smart Question Pooling & Randomization ---
        isQuestionBank: {
            type: Boolean,
            default: false
        },
        questionsToAsk: {
            type: Number,
            default: 0 // If 0 or not isQuestionBank, ask all questions.
        },
        // --------------------------------------------------------
        questions: [
            {
                type: {
                    type: String,
                    enum: ["mcq", "short-answer"],
                    required: true,
                },
                question: { type: String, required: true },
                options: [String], // For MCQ only
                correctAnswer: { type: String, required: true },
                explanation: { type: String, required: true },
            },
        ],
        attempts: [
            {
                studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                studentName: String,
                score: Number,
                totalQuestions: Number,
                percentage: Number,
                answers: [String],
                attemptedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
