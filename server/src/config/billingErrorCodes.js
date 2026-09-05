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

/**
 * billingErrorCodes.js
 * Standardized error codes for frontend-backend contract.
 */

export const BILLING_ERRORS = {
    // Validation Errors
    INVALID_CURRENCY: "INVALID_CURRENCY",
    INVALID_AMOUNT: "INVALID_AMOUNT",
    NON_INTEGER_PAISE: "NON_INTEGER_PAISE",
    MISSING_TAX_RULE: "MISSING_TAX_RULE",

    // State Errors
    INVOICE_ALREADY_PAID: "INVOICE_ALREADY_PAID",
    INVOICE_IMMUTABLE: "INVOICE_IMMUTABLE", // Cannot modify after ISSUED
    SUBSCRIPTION_NOT_ACTIVE: "SUBSCRIPTION_NOT_ACTIVE",
    PLAN_RETIRED: "PLAN_RETIRED",

    // Payment Errors
    PAYMENT_FAILED: "PAYMENT_FAILED",
    SIGNATURE_MISMATCH: "SIGNATURE_MISMATCH",
    DUPLICATE_WEBHOOK: "DUPLICATE_WEBHOOK",
    ORDER_CREATION_FAILED: "ORDER_CREATION_FAILED",
    REFUND_FAILED: "REFUND_FAILED",

    // Concurrency Errors
    CONCURRENT_MODIFICATION: "CONCURRENT_MODIFICATION",
    IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT"
};
