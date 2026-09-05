/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const paymentSettlementSchema = new mongoose.Schema(
    {
        providerSettlementId: { // Razorpay settlement_id
            type: String,
            required: true,
            unique: true,
        },
        merchantOrganizationId: { // The org that received the money
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        amountSettledPaise: { // Actual money hitting the bank
            type: Number,
            required: true,
        },
        feesTotalPaise: { // Razorpay fees + platform fees
            type: Number,
            required: true,
        },
        taxTotalPaise: { // Tax on fees
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["CREATED", "PROCESSED", "FAILED"],
            default: "CREATED",
        },
        utr: { // Bank UTR (Unique Transaction Reference)
            type: String,
            default: null,
        },
        settledAt: { // Timestamp from the webhook when it hit the bank
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

paymentSettlementSchema.index({ providerSettlementId: 1 }, { unique: true });
paymentSettlementSchema.index({ status: 1, settledAt: 1 });

export default mongoose.models.PaymentSettlement || mongoose.model("PaymentSettlement", paymentSettlementSchema);
