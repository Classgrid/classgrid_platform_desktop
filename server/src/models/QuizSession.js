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

const quizSessionSchema = new mongoose.Schema(
    {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        subject: { type: String, required: true },
        topic: { type: String, required: true },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
        totalQuestions: { type: Number, required: true },
        questions: [
            {
                type: { type: String, enum: ["mcq", "written"], required: true },
                question: { type: String, required: true },
                options: [String], // MCQ only
                correctAnswer: { type: String, required: true },
                studentAnswer: { type: String, default: "" },
                isCorrect: { type: Boolean, default: false },
                explanation: { type: String, default: "" },
            },
        ],
        score: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        timeTaken: { type: Number, default: 0 }, // seconds
        classroomId: { type: String, default: "" },
        completedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// 🗑️ TTL: auto-delete quiz sessions older than 5 days to keep storage minimal
quizSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 24 * 60 * 60 });

export default mongoose.model("QuizSession", quizSessionSchema);
