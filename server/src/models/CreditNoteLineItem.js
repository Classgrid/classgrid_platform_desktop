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

const creditNoteLineItemSchema = new mongoose.Schema(
    {
        creditNoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CreditNote",
            required: true,
        },
        invoiceLineItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InvoiceLineItem",
            default: null,
        },
        description: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        unitPricePaise: {
            type: Number,
            default: 0,
        },
        subtotalPaise: {
            type: Number,
            default: 0,
        },
        taxAmountPaise: {
            type: Number,
            default: 0,
        },
        totalAmountPaise: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

creditNoteLineItemSchema.index({ creditNoteId: 1 });

export default mongoose.models.CreditNoteLineItem || mongoose.model("CreditNoteLineItem", creditNoteLineItemSchema);
