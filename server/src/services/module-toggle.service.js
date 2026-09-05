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
 * Determines which features are active for an organization based on subscription state.
 * Classgrid uses a strict lifecycle:
 * - demo: mandatory 31-day onboarding/demo window
 * - active: the single paid production state after the demo ends
 */

const PLAN_FEATURES = {
    demo: {
        attendance: true,
        examinations: true,
        admissions: true,
        canteen: true,
        ai_viva: true,
        naac_auditor: true,
    },
    sandbox: {
        attendance: true,
        examinations: true,
        admissions: true,
        canteen: true,
        ai_viva: true,
        naac_auditor: true,
    },
    active: {
        attendance: true,
        examinations: true,
        admissions: true,
        canteen: true,
        ai_viva: true,
        naac_auditor: true,
    }
};

/**
 * Checks if a specific feature is enabled for an organization.
 * @param {string} plan - The subscription state (demo, active)
 * @param {string} featureKey - The feature to check (e.g., 'admissions')
 */
export const isFeatureEnabled = (plan, featureKey) => {
    const tier = plan?.toLowerCase() || 'demo';
    const features = PLAN_FEATURES[tier] || PLAN_FEATURES.demo;
    return !!features[featureKey];
};

/**
 * Gets all limits for a given plan.
 */
export const getPlanLimits = (plan) => {
    const tier = plan?.toLowerCase() || 'demo';
    return PLAN_FEATURES[tier] || PLAN_FEATURES.demo;
};

export default { isFeatureEnabled, getPlanLimits };
