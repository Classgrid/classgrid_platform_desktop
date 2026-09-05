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

import mongoose from "mongoose";

const invoiceDeliverySchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        deliveryEvent: {
            type: String,
            enum: ["EMAIL_SENT", "EMAIL_FAILED", "DOWNLOADED", "REMINDER_SENT"],
            required: true,
        },
        emailSentTo: {
            type: String,
            default: null,
        },
        errorDetails: {
            type: String,
            default: null,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Can be null if system generated
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

invoiceDeliverySchema.index({ invoiceId: 1, createdAt: -1 });

export default mongoose.models.InvoiceDelivery || mongoose.model("InvoiceDelivery", invoiceDeliverySchema);
