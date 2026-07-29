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
