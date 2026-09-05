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

import OrganizationBillingUsageSnapshot from "../../models/OrganizationBillingUsageSnapshot.js";

/**
 * BillingUsageService
 * Retrieves usage metrics for a given billing period to calculate usage-based billing.
 */
class BillingUsageService {
    /**
     * Gets the latest snapshot for a specific metric and period
     */
    static async getUsage(organizationId, metricCode, periodStart, periodEnd) {
        const snapshot = await OrganizationBillingUsageSnapshot.findOne({
            organizationId,
            metricCode,
            billingPeriodStart: { $gte: periodStart },
            billingPeriodEnd: { $lte: periodEnd }
        }).sort({ calculatedAt: -1 }).lean();

        return snapshot ? snapshot.quantity : 0;
    }
}

export default BillingUsageService;
