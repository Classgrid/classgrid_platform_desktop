import mongoose from "mongoose";

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
        providerPaymentId: { // Razorpay payment_id
            type: String,
            required: true,
            unique: true,
        },
        amountCapturedPaise: {
            type: Number,
            required: true,
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
        },
        taxPaise: { // Tax on Razorpay processing fee
            type: Number,
            default: 0,
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
paymentTransactionSchema.index({ providerPaymentId: 1 }, { unique: true });

export default mongoose.models.PaymentTransaction || mongoose.model("PaymentTransaction", paymentTransactionSchema);
