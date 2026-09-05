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
import { PAYMENT_FLOW, MERCHANT_TYPE } from "../utils/billing.utils.js";

const paymentOrderSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        invoiceId: { // Only present for Classgrid SaaS payments
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            default: null,
        },
        referenceId: { // Can be an invoiceId, feeRecordId, or other generic entity
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        paymentFlow: {
            type: String,
            enum: Object.values(PAYMENT_FLOW),
            required: true,
        },
        merchantType: {
            type: String,
            enum: Object.values(MERCHANT_TYPE),
            required: true,
        },
        merchantOrganizationId: { // The org that actually receives the money (Classgrid or the Institution)
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null,
        },
        amountPaise: {
            type: Number,
            required: true,
            min: 1,
        },
        currency: {
            type: String,
            default: "INR",
        },
        providerOrderId: { // Razorpay order_id
            type: String,
            required: true,
            unique: true,
            sparse: true
        },
        receiptId: { // Our internal receipt id passed to Razorpay
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["CREATED", "ATTEMPTED", "PAID", "EXPIRED", "CANCELLED"],
            default: "CREATED",
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

paymentOrderSchema.index({ invoiceId: 1 });

export default mongoose.models.PaymentOrder || mongoose.model("PaymentOrder", paymentOrderSchema);
