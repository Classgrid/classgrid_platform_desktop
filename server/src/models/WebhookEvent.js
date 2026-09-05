/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

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

// Redact sensitive payload data before saving
webhookEventSchema.pre("save", function() {
    if (this.isModified("payload") && this.payload) {
        const redact = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            const sensitiveKeys = ["vpa", "card_id", "card", "billing_address"];
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    redact(obj[key]);
                } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                    obj[key] = "[REDACTED]";
                }
            }
        };
        // Deep clone payload to avoid modifying the original request object reference
        const safePayload = JSON.parse(JSON.stringify(this.payload));
        redact(safePayload);
        this.payload = safePayload;
    }
});

// Deduplication index
webhookEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);
