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

import { getFacultyDashboardSummary } from "../services/faculty-dashboard.service.js";

/**
 * Controller to handle fetching all metrics, schedule, and announcements for the Faculty Dashboard.
 * @param {object} req - Express Request object
 * @param {object} res - Express Response object
 */
export const getFacultyDashboardData = async (req, res) => {
  try {
    // 1. Extract context from middleware
    const facultyId = req.user._id;
    const orgId = req.institutionOrganization?._id || req.user.organization_id;
    const profile = req.institutionProfile; // Passing the full profile to fully respect the 4x2 DNA!

    if (!orgId || !facultyId) {
      return res.status(400).json({ success: false, message: "Missing required organization or user context." });
    }

    // 2. Pass context to the Service Layer
    const data = await getFacultyDashboardSummary(facultyId, orgId, profile);

    // 3. Format Response
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[faculty-dashboard.controller] Error in getFacultyDashboardData:", error);
    return res.status(500).json({ success: false, message: "Internal server error while fetching faculty dashboard." });
  }
};
