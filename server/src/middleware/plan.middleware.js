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
