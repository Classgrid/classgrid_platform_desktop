import mongoose from "mongoose";
import { PAYMENT_FLOW, MERCHANT_TYPE } from "../utils/billing.utils.js";

const paymentTransactionSchema = new mongoose.Schema(
    {
        paymentAttemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentAttempt",
            required: true,
            unique: true, // Only one successful transaction per attempt
        },
        paymentOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentOrder",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        paymentFlow: {
            type: String,
            enum: Object.values(PAYMENT_FLOW),
            required: true,
        },
        merchantType: {
            type: String,
            enum: Object.values(MERCHANT_TYPE),
            required: true,
        },
        merchantOrganizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null,
        },
        providerPaymentId: { // Razorpay payment_id
            type: String,
            required: true,
            unique: true,
        },
        amountCapturedPaise: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isSafeInteger, message: "{VALUE} is not an integer paise value" },
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: { // e.g. "UPI", "CARD", "NET_BANKING", "WALLET"
            type: String,
            required: true,
        },
        feePaise: { // Razorpay processing fee
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isSafeInteger, message: "{VALUE} is not an integer paise value" },
        },
        taxPaise: { // Tax on Razorpay processing fee
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isSafeInteger, message: "{VALUE} is not an integer paise value" },
        },
        bankReference: {
            type: String,
            default: null, // RRN, Bank Transaction ID, etc.
        },
        cardInfo: {
            network: String,
            last4: String,
            issuer: String,
        },
        vpa: { // For UPI payments
            type: String,
            default: null,
        },
        international: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED", "FAILED", "DISPUTED"],
            default: "CAPTURED",
        },
        settlementStatus: {
            type: String,
            enum: ["UNSETTLED", "SETTLED", "FAILED"],
            default: "UNSETTLED",
        },
        paymentSettlementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentSettlement",
            default: null,
        },
        capturedAt: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

paymentTransactionSchema.index({ status: 1, createdAt: 1 });
paymentTransactionSchema.index({ paymentFlow: 1, status: 1, capturedAt: -1 });
paymentTransactionSchema.index({ providerPaymentId: 1 }, { unique: true });

export default mongoose.models.PaymentTransaction || mongoose.model("PaymentTransaction", paymentTransactionSchema);
