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

/**
 * Billing Constants and Enums
 */

export const BILLING_CYCLE = {
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    HALF_YEARLY: 'HALF_YEARLY',
    ANNUAL: 'ANNUAL'
};

export const PLAN_STATUS = {
    DRAFT: 'DRAFT',
    SCHEDULED: 'SCHEDULED',
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED'
};

export const SUBSCRIPTION_STATUS = {
    TRIAL: 'TRIAL',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    SUSPENDED: 'SUSPENDED',
    CANCELLED: 'CANCELLED'
};

export const INVOICE_STATUS = {
    DRAFT: 'DRAFT',
    ISSUED: 'ISSUED',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    VOID: 'VOID',
    REFUNDED: 'REFUNDED',
    PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
};

export const PAYMENT_ATTEMPT_STAGE = {
    TOKEN_CREATED: 'TOKEN_CREATED',
    OTP_PENDING: 'OTP_PENDING',
    OTP_VERIFIED: 'OTP_VERIFIED',
    ORDER_CREATED: 'ORDER_CREATED',
    CHECKOUT_OPENED: 'CHECKOUT_OPENED',
    AUTHORIZED: 'AUTHORIZED',
    CAPTURED: 'CAPTURED',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED'
};

export const PAYMENT_FLOW = {
    CLASSGRID_SUBSCRIPTION: 'CLASSGRID_SUBSCRIPTION',
    INSTITUTION_FEE: 'INSTITUTION_FEE'
};

export const MERCHANT_TYPE = {
    CLASSGRID: 'CLASSGRID',
    INSTITUTION: 'INSTITUTION'
};

export const CREDIT_LEDGER_TYPE = {
    CREDIT_GRANTED: 'CREDIT_GRANTED',
    CREDIT_APPLIED: 'CREDIT_APPLIED',
    CREDIT_EXPIRED: 'CREDIT_EXPIRED',
    CREDIT_REVERSED: 'CREDIT_REVERSED',
    MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT'
};

export const SUBSCRIPTION_CHANGE_REASON = {
    PLAN_ASSIGNED: 'PLAN_ASSIGNED',
    PLAN_UPGRADED: 'PLAN_UPGRADED',
    PLAN_DOWNGRADED: 'PLAN_DOWNGRADED',
    MODULE_ADDED: 'MODULE_ADDED',
    MODULE_REMOVED: 'MODULE_REMOVED',
    PRICE_OVERRIDDEN: 'PRICE_OVERRIDDEN',
    BILLING_CYCLE_CHANGED: 'BILLING_CYCLE_CHANGED',
    SUBSCRIPTION_PAUSED: 'SUBSCRIPTION_PAUSED',
    SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED'
};

/**
 * Money Utility
 * Converts rupees (float/string) to paise (integer) safely.
 */
export const toPaise = (rupees) => {
    if (rupees === null || rupees === undefined) return 0;
    const num = Number(rupees);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
};

export const toRupees = (paise) => {
    if (paise === null || paise === undefined) return 0;
    const num = Number(paise);
    if (isNaN(num)) return 0;
    return num / 100;
};
