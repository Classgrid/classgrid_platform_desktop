const fs = require('fs');

const controllerPath = 'server/src/controllers/org-configuration.controller.js';
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

if (!controllerContent.includes('updateOrganizationBillingSettings')) {
    const newController = `
export const updateOrganizationBillingSettings = async (req, res) => {
    try {
        const orgId = (req.effectiveOrganizationId || req.user?.organization_id || req.headers['x-org-id']);
        if (!orgId) return res.status(400).json({ message: "No organization associated." });

        const org = await Organization.findById(orgId);
        if (!org) return res.status(404).json({ message: "Organization not found." });

        if (!org.billing_settings) org.billing_settings = {};

        const fields = ['address_line1', 'address_line2', 'city', 'state', 'pincode', 'billing_contact_name', 'phone', 'gstin'];
        for (const field of fields) {
            if (req.body[field] !== undefined) {
                org.billing_settings[field] = req.body[field];
            }
        }

        org.markModified('billing_settings');
        await org.save();

        return res.json({ message: "Billing settings updated successfully.", billingSettings: org.billing_settings });
    } catch (error) {
        console.error("[UpdateBillingSettings] Error:", error);
        return res.status(500).json({ message: "Unable to update billing settings." });
    }
};
`;
    controllerContent += newController;
    fs.writeFileSync(controllerPath, controllerContent);
}

const routesPath = 'server/src/routes/org.routes.js';
let routesContent = fs.readFileSync(routesPath, 'utf8');

if (!routesContent.includes('updateOrganizationBillingSettings')) {
    routesContent = routesContent.replace(
        'verifyBillingPhoneOtp,',
        'verifyBillingPhoneOtp,\n    updateOrganizationBillingSettings,'
    );
    routesContent = routesContent.replace(
        'router.get("/billing", isAuthenticated, requireRole("org_admin"), getOrganizationBilling);',
        'router.get("/billing", isAuthenticated, requireRole("org_admin"), getOrganizationBilling);\nrouter.put("/billing/settings", isAuthenticated, requireRole("org_admin"), updateOrganizationBillingSettings);'
    );
    fs.writeFileSync(routesPath, routesContent);
}
