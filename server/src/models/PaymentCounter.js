import mongoose from "mongoose";

/**
 * PaymentCounter
 * 
 * A simple atomic counter stored in MongoDB.
 * Used to track how many real payments have been processed —
 * so we know when we've hit 500 transactions for the ML training dataset.
 * 
 * Each counter has a unique `key` (e.g. "demo_training_count").
 * We use findOneAndUpdate with $inc for atomic increments — no race conditions.
 */
const PaymentCounterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        count: {
            type: Number,
            default: 0,
        },
        target: {
            type: Number,
            default: 500, // Target: 500 transactions for ML training
        },
        lastUpdatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const PaymentCounter = mongoose.model("PaymentCounter", PaymentCounterSchema);
export default PaymentCounter;
