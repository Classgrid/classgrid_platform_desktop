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

import Organization from "../models/Organization.js";

export function requirePlan(minimumPlan) {
    return (req, res, next) => next();
}

export function requireFeature(feature) {
    return async (req, res, next) => {
        try {
            const orgId = req.effectiveOrganizationId || req.user?.organization_id;
            if (!orgId) return next(); // If no org context, allow pass-through or let other auth middleware handle it

            // Fetch the org's feature flags
            const org = await Organization.findById(orgId).select("feature_flags").lean().maxTimeMS(2000);
            
            if (!org) return res.status(404).json({ message: "Organization not found" });

            // If the specific feature flag exists and is explicitly set to false, block it
            if (org.feature_flags && org.feature_flags[feature] === false) {
                return res.status(403).json({ 
                    success: false, 
                    code: "MODULE_DISABLED",
                    message: `The ${feature.replace(/_/g, " ")} is not enabled for your organization.` 
                });
            }

            next();
        } catch (error) {
            console.error("[RequireFeature] Error:", error.message);
            next();
        }
    };
}
