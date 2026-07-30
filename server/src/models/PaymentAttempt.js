import mongoose from "mongoose";
import { PAYMENT_ATTEMPT_STAGE } from "../utils/billing.utils.js";

const paymentAttemptSchema = new mongoose.Schema(
    {
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
        stage: {
            type: String,
            enum: Object.values(PAYMENT_ATTEMPT_STAGE),
            default: PAYMENT_ATTEMPT_STAGE.TOKEN_CREATED,
        },
        providerPaymentId: { // Razorpay payment_id (can be null if attempt failed before getting one)
            type: String,
            default: null,
        },
        method: { // e.g. "UPI", "CARD", "NET_BANKING", "WALLET"
            type: String,
            default: null,
        },
        amountPaise: {
            type: Number,
            required: true,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // The user attempting the payment
        }
    },
    {
        timestamps: true,
    }
);

paymentAttemptSchema.index({ paymentOrderId: 1 });
paymentAttemptSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });

export default mongoose.models.PaymentAttempt || mongoose.model("PaymentAttempt", paymentAttemptSchema);
