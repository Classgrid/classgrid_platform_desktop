import mongoose from "mongoose";

const aiCreditTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        amount_inr: {
            type: Number,
            required: true,
        },
        credits_added: {
            type: Number,
            required: true,
            comment: "Number of tokens added to user balance. 1 Credit = 1 Token.",
        },
        razorpay_payment_id: {
            type: String,
            required: true,
            unique: true,
            sparse: true,
        },
        razorpay_order_id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["topup", "grant", "refund", "adjustment"],
            default: "topup",
        },
        status: {
            type: String,
            enum: ["success", "failed", "pending"],
            default: "pending",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        }
    },
    {
        timestamps: true, // Auto-adds createdAt and updatedAt
        optimisticConcurrency: true,
    }
);

// Indexes for fast lookup by user and org
aiCreditTransactionSchema.index({ userId: 1, createdAt: -1 });
aiCreditTransactionSchema.index({ orgId: 1, createdAt: -1 });


export default mongoose.models.AiCreditTransaction || mongoose.model("AiCreditTransaction", aiCreditTransactionSchema);
