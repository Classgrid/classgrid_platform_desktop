const fs = require('fs');

const newCode = `
// =================================================
// UPDATE ORGANIZATION STATUS
// =================================================
export const updateOrganizationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['active', 'suspended', 'blocked', 'sandbox', 'setup_in_progress'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        // We do not need to import Organization if it's already at the top, but just in case:
        const Organization = (await import("../models/Organization.js")).default;
        
        const org = await Organization.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        res.json({ success: true, message: 'Organization status updated successfully', organization: org });
    } catch (err) {
        console.error('[SuperAdmin] updateOrganizationStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
`;

const content = fs.readFileSync('server/src/controllers/super-admin.controller.js', 'utf8');
fs.writeFileSync('server/src/controllers/super-admin.controller.js', content + newCode, 'utf8');

let routesContent = fs.readFileSync('server/src/routes/super-admin.routes.js', 'utf8');

// Insert the import
routesContent = routesContent.replace(
  'getOrganizationDetail,',
  'getOrganizationDetail, updateOrganizationStatus,'
);

// Insert the route mapping
const routeString = `
// =================================================
// UPDATE ORGANIZATION STATUS
// =================================================
router.put("/orgs/:id/status", isAuthenticated, requireRole("super_admin"), updateOrganizationStatus);

`;
// Insert before "export default router;"
routesContent = routesContent.replace(
  'export default router;',
  routeString + 'export default router;'
);

fs.writeFileSync('server/src/routes/super-admin.routes.js', routesContent, 'utf8');
console.log('Appended controller and routes');
