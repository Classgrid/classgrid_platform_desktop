/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const reconciliationRunSchema = new mongoose.Schema(
    {
        runDate: {
            type: Date,
            default: Date.now,
        },
        targetDate: { // The date of transactions being reconciled
            type: Date,
            required: true,
        },
        provider: {
            type: String, // e.g. "RAZORPAY"
            required: true,
        },
        totalTransactionsChecked: {
            type: Number,
            default: 0,
        },
        mismatchesFound: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
            default: "IN_PROGRESS",
        },
        errorDetails: {
            type: String,
            default: null,
        },
        runBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Can be null if system cron
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.ReconciliationRun || mongoose.model("ReconciliationRun", reconciliationRunSchema);
