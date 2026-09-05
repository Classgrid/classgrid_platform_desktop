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

// Plan Config - single paid product. Pricing is decided outside code later.
const PAID_PLAN = {
    id: "paid",
    label: "Paid",
    priceINR: null,
    studentLimit: 999999,
    maxFaculty: 999,
    features: ["all"],
    storageGB: 1000,
    support: "priority",
};

export const PLANS = {
    PAID: PAID_PLAN,
    STANDARD: PAID_PLAN,
};

export const normalizePlan = () => "PAID";
export const PLAN_RANK = { PAID: 1, STANDARD: 1 };
export const planHasFeature = () => true;

// Mock functions to avoid breaking missing imports
export const getStudentLimit = () => 999999;
export const getMaxStudentsPerClassroom = () => 999999;
export const getMaxClassroomsPerFaculty = () => 999999;
export const getMaxFaculty = () => 999999;
export const getEffectivePlan = () => 'PAID';

export const PAYMENT_CONFIG = {
    upiId: "legacy@upi",
    qrImageUrl: "",
};
