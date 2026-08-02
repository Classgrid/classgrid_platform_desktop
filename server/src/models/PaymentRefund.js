import mongoose from "mongoose";

const paymentRefundSchema = new mongoose.Schema(
    {
        paymentTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        providerRefundId: { // Razorpay refund_id
            type: String,
            required: true,
            unique: true,
        },
        amountPaise: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isSafeInteger, message: "{VALUE} is not an integer paise value" },
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSED", "FAILED"],
            default: "PENDING",
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        speedRequested: { // e.g. "optimum", "normal"
            type: String,
            default: "normal",
        },
        speedProcessed: {
            type: String,
            default: "normal",
        },
        receipt: { // Internal tracking ID
            type: String,
            default: null,
        },
        bankReference: { // ARN/RRN
            type: String,
            default: null,
        },
        processedAt: {
            type: Date,
            default: null,
        },
        createdBy: { // The admin who initiated the refund
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true,
    }
);
export default mongoose.models.PaymentRefund || mongoose.model("PaymentRefund", paymentRefundSchema);
