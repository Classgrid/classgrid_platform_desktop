import AdminAuditLog from "../models/AdminAuditLog.js";
import Organization from "../models/Organization.js";

/**
 * logAdminAction — fire-and-forget audit writer.
 * Call after any successful admin mutation.
 *
 * SECURITY: actorId, actorName, actorRole, organization_id
 * are ALWAYS derived from req.user — never from request body.
 *
 * @param {object} req         - Express request (provides user + IP + UA)
 * @param {string} action      - Action enum value from AdminAuditLog schema
 * @param {string} targetType  - Type of entity affected
 * @param {string|null} targetId   - ID of affected entity
 * @param {string} targetName  - Human-readable name of affected entity
 * @param {object} metadata    - Optional diff info { oldRole, newRole, etc. }
 * @param {string|null} forceOrgId - Optional override for organization_id
 * @param {string} status      - 'success' | 'failure' | 'pending'
 * @param {number} durationMs  - Optional override for duration, otherwise auto-calc from req._startTime
 */
export async function logAdminAction(req, action, targetType, targetId = null, targetName = "", metadata = {}, forceOrgId = null, status = "success", durationMs = null) {
    try {
        const actor = req.user;
        if (!actor) return; // should never happen, but be safe

        let orgId = actor.organization_id || forceOrgId;

        // Auto-resolve organization if missing (common for Super Admins)
        if (!orgId && targetId) {
            if (targetType === "organization") {
                orgId = targetId;
            } else if (targetType === "user" || targetType === "faculty" || targetType === "student") {
                const User = (await import("../models/User.js")).default;
                const targetUser = await User.findById(targetId).select("organization_id").lean();
                if (targetUser) orgId = targetUser.organization_id;
            } else if (targetType === "users") {
                // For bulk user actions, targetId is usually the orgId
                orgId = targetId;
            } else if (targetType === "classroom") {
                const Classroom = (await import("../models/Classroom.js")).default;
                const targetClass = await Classroom.findById(targetId).select("organization_id").lean();
                if (targetClass) orgId = targetClass.organization_id;
            }
        }

        let orgName = "";
        if (orgId) {
            const org = await Organization.findById(orgId).select("name").lean();
            orgName = org?.name || "";
        }

        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "";

        const userAgent = (req.headers["user-agent"] || "").substring(0, 300);

        let finalDuration = durationMs;
        if (finalDuration === null && req._startTime) {
            finalDuration = Date.now() - new Date(req._startTime).getTime();
        }

        await AdminAuditLog.create({
            actorId: actor._id,
            actorName: actor.name || actor.email || "Unknown",
            actorRole: actor.role,
            organization_id: orgId || null,
            organizationName: orgName,
            action,
            targetId: targetId ? String(targetId) : null,
            targetName: String(targetName || ""),
            targetType,
            metadata,
            ip,
            userAgent,
            durationMs: finalDuration || 0,
            status,
            timestamp: new Date(),
        });
    } catch (err) {
        // Audit log failure must NEVER break the main flow
        console.error("[AuditLog] Failed to write audit log:", err.message);
    }
}
