/**
 * Billing Permissions Middleware
 * Ensures the user has Super Admin role or explicit billing access.
 */

export const requireSuperAdminBillingAccess = (req, res, next) => {
    // Assuming req.user is populated by earlier auth middleware
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["super_admin", "billing_admin"].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden: Requires Super Admin or Billing Admin role." });
    }

    next();
};

export const requireFinancialWriteAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "super_admin") {
        return res.status(403).json({ success: false, message: "Forbidden: Only Super Admins can issue refunds or edit ledger entries." });
    }

    next();
};
