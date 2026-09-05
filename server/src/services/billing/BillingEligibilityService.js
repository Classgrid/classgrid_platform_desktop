/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import BillingEligibilityRule from "../../models/BillingEligibilityRule.js";

/**
 * BillingEligibilityService
 * Validates if an organization can subscribe to a given plan or module based on rules.
 */
class BillingEligibilityService {
    /**
     * Check if an org is eligible for a plan or module.
     * @param {Object} orgContext - Retrieved from OrganizationBillingContextService
     * @param {String} entityType - "PLAN" or "MODULE"
     * @param {String} entityId - ObjectId string
     */
    static async checkEligibility(orgContext, entityType, entityId) {
        const rules = await BillingEligibilityRule.find({
            entityType,
            entityId,
            effectiveFrom: { $lte: new Date() },
            $or: [
                { effectiveUntil: null },
                { effectiveUntil: { $gt: new Date() } }
            ]
        }).lean();

        // If no rules exist, default to eligible
        if (rules.length === 0) return { eligible: true };

        for (const rule of rules) {
            // Check Exclusions First
            if (rule.excludedOrgTypes.includes(orgContext.orgType)) return { eligible: false, reason: `OrgType ${orgContext.orgType} is explicitly excluded.` };
            if (rule.excludedStructureTypes.includes(orgContext.structureType)) return { eligible: false, reason: `StructureType ${orgContext.structureType} is explicitly excluded.` };

            // Check Inclusions
            if (rule.allowedOrgTypes.length > 0 && !rule.allowedOrgTypes.includes(orgContext.orgType)) {
                return { eligible: false, reason: `OrgType ${orgContext.orgType} is not in allowed list.` };
            }
            if (rule.allowedStructureTypes.length > 0 && !rule.allowedStructureTypes.includes(orgContext.structureType)) {
                return { eligible: false, reason: `StructureType ${orgContext.structureType} is not in allowed list.` };
            }
            if (rule.allowedDivisionModes.length > 0 && !rule.allowedDivisionModes.includes(orgContext.divisionMode)) {
                return { eligible: false, reason: `DivisionMode ${orgContext.divisionMode} is required.` };
            }
            if (rule.requiresSubBatches && !orgContext.allowSubBatches) {
                return { eligible: false, reason: "Sub-batches are required for this module." };
            }
        }

        return { eligible: true };
    }
}

export default BillingEligibilityService;
