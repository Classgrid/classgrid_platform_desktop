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
import { CREDIT_LEDGER_TYPE } from "../utils/billing.utils.js";

const organizationCreditEntrySchema = new mongoose.Schema(
    {
        organizationCreditAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationCreditAccount",
            required: true,
        },
        entryType: {
            type: String,
            enum: Object.values(CREDIT_LEDGER_TYPE),
            required: true,
        },
        amountPaise: { // Positive for additions, Negative for deductions
            type: Number,
            required: true,
        },
        balanceAfterPaise: { // The resulting balance after this transaction
            type: Number,
            required: true,
        },
        referenceType: { // e.g. "Invoice", "Manual Adjustment", "Refund"
            type: String,
            default: null,
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null, // The related document (like the Invoice ID)
        },
        reason: {
            type: String,
            default: "",
        },
        createdBy: { // Can be null if system generated
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Immutable Ledger
organizationCreditEntrySchema.pre("save", function (next) {
    if (!this.isNew) {
        return next(new Error("OrganizationCreditEntry is immutable and cannot be modified."));
    }
    next();
});

export default mongoose.models.OrganizationCreditEntry || mongoose.model("OrganizationCreditEntry", organizationCreditEntrySchema);
