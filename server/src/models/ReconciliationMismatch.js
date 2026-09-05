/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const reconciliationMismatchSchema = new mongoose.Schema(
    {
        reconciliationRunId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ReconciliationRun",
            required: true,
        },
        providerTransactionId: {
            type: String, // e.g. Razorpay payment_id
            required: true,
        },
        internalTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction",
            default: null, // Null if payment exists in provider but not in our DB
        },
        mismatchType: {
            type: String,
            enum: [
                "MISSING_IN_DB", // Captured in provider, missing in our DB
                "MISSING_IN_PROVIDER", // Recorded as captured in our DB, missing/failed in provider
                "AMOUNT_MISMATCH",
                "STATUS_MISMATCH"
            ],
            required: true,
        },
        providerState: {
            type: mongoose.Schema.Types.Mixed, // The state according to the provider API
            default: null,
        },
        internalState: {
            type: mongoose.Schema.Types.Mixed, // The state according to our DB
            default: null,
        },
        resolved: {
            type: Boolean,
            default: false,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        resolutionNote: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

reconciliationMismatchSchema.index({ reconciliationRunId: 1 });
reconciliationMismatchSchema.index({ resolved: 1 });

export default mongoose.models.ReconciliationMismatch || mongoose.model("ReconciliationMismatch", reconciliationMismatchSchema);
