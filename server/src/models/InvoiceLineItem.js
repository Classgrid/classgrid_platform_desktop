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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

const invoiceLineItemSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        planVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            default: null,
        },
        moduleVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModuleVersion",
            default: null,
        },
        servicePeriodStart: {
            type: Date,
            default: null,
        },
        servicePeriodEnd: {
            type: Date,
            default: null,
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
        discountAmountPaise: {
            type: Number,
            default: 0,
        },
        taxRatePercentage: {
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
        },
    },
    {
        timestamps: true,
    }
);

invoiceLineItemSchema.index({ invoiceId: 1 });

export default mongoose.models.InvoiceLineItem || mongoose.model("InvoiceLineItem", invoiceLineItemSchema);
