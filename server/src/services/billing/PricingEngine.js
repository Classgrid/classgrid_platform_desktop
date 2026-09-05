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

import OrganizationPriceOverride from "../../models/OrganizationPriceOverride.js";
import PlanModule from "../../models/PlanModule.js";

/**
 * PricingEngine
 * Determines the final active price for a module or plan for a specific organization.
 */
class PricingEngine {
    /**
     * Resolves the price for a specific module under a specific plan.
     * Order of precedence:
     * 1. Org-specific override
     * 2. Plan-module override
     * 3. Module-version standard price (passed in)
     */
    static async resolveModulePrice(organizationId, planVersionId, moduleVersionId, defaultMonthlyPaise, defaultAnnualPaise, billingCycle = "MONTHLY") {
        // 1. Check Org Override
        const orgOverride = await OrganizationPriceOverride.findOne({
            organizationId,
            billingModuleId: moduleVersionId, // Simplified for this prototype
            effectiveFrom: { $lte: new Date() },
            $or: [{ effectiveUntil: null }, { effectiveUntil: { $gt: new Date() } }]
        }).sort({ createdAt: -1 }).lean();

        if (orgOverride) {
            return {
                amountPaise: billingCycle === "ANNUAL" ? orgOverride.annualPricePaise : orgOverride.monthlyPricePaise,
                source: "ORGANIZATION_OVERRIDE",
                includedQuantity: orgOverride.includedQuantity || 0
            };
        }

        // 2. Check Plan-Module Override
        const planModule = await PlanModule.findOne({
            billingPlanVersionId: planVersionId,
            billingModuleId: moduleVersionId // Simplified mapping
        }).lean();

        if (planModule && (planModule.monthlyPricePaise > 0 || planModule.annualPricePaise > 0)) {
            return {
                amountPaise: billingCycle === "ANNUAL" ? planModule.annualPricePaise : planModule.monthlyPricePaise,
                source: "PLAN_MODULE_OVERRIDE",
                includedQuantity: planModule.includedQuantity || 0
            };
        }

        // 3. Fallback to default version price
        return {
            amountPaise: billingCycle === "ANNUAL" ? defaultAnnualPaise : defaultMonthlyPaise,
            source: "MODULE_VERSION_DEFAULT",
            includedQuantity: 0
        };
    }
}

export default PricingEngine;
