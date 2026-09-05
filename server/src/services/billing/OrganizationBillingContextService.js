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

import Organization from "../../models/Organization.js";

/**
 * OrganizationBillingContextService
 * Fetches and structures the organization's type, structure, and terminology for billing purposes.
 */
class OrganizationBillingContextService {
    static async getContext(organizationId) {
        const org = await Organization.findById(organizationId).lean();
        if (!org) {
            throw new Error(`Organization ${organizationId} not found`);
        }

        // Simulating the terminology fetch that should hit GET /api/hierarchy/terminology internally
        // For billing, we just need the structure and division modes.
        const terminology = this.resolveTerminology(org.org_type, org.structure_type);

        return {
            organizationId: org._id.toString(),
            orgType: org.org_type || "other",
            structureType: org.structure_type || "custom",
            divisionMode: org.division_mode || "no_divisions", // Assuming this is set on Org
            allowSubBatches: org.allow_sub_batches || false, // Assuming this is set on Org
            terminology
        };
    }

    static resolveTerminology(orgType, structureType) {
        // Fallbacks for billing context
        const base = {
            learner: "Learner",
            staff: "Staff",
            division: "Division",
            subBatch: "Batch"
        };

        if (orgType === "school") {
            base.learner = "Student";
            base.staff = "Teacher";
            base.division = "Section";
        } else if (orgType === "engineering" || orgType === "diploma") {
            base.learner = "Student";
            base.staff = "Faculty";
            base.division = "Division";
            base.subBatch = "Lab Batch";
        } else if (orgType === "coaching") {
            base.learner = "Student";
            base.staff = "Mentor";
            base.division = "Batch";
        } else if (orgType === "junior_college") {
            base.learner = "Student";
            base.staff = "Lecturer";
            base.division = "Division";
        }
        
        return base;
    }
}

export default OrganizationBillingContextService;
