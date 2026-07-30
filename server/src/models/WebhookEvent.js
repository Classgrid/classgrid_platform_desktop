import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
    {
        provider: { // e.g. "RAZORPAY"
            type: String,
            required: true,
            uppercase: true,
        },
        providerEventId: { // e.g. "ev_abcdefgh"
            type: String,
            required: true,
        },
        eventType: { // e.g. "payment.captured", "refund.processed"
            type: String,
            required: true,
        },
        payloadHash: { // To detect if payload changed for same event ID
            type: String,
            required: true,
        },
        signatureValid: {
            type: Boolean,
            required: true,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed, // The raw unparsed JSON payload
            required: true,
        },
        receivedAt: {
            type: Date,
            default: Date.now,
        },
        processedAt: {
            type: Date,
            default: null,
        },
        processingStatus: {
            type: String,
            enum: ["PENDING", "PROCESSED", "FAILED", "IGNORED"], // Ignored for events we don't care about
            default: "PENDING",
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        lastError: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// Deduplication index
webhookEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);
