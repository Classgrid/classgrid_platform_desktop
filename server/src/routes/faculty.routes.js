/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import express from 'express';
import { isAuthenticated, requireOrganization } from '../middleware/auth.middleware.js';
import { attachInstitutionProfile } from '../middleware/institution-profile.middleware.js';
import { getFacultyDashboardData } from '../controllers/faculty-dashboard.controller.js';

const router = express.Router();

// ======================================================
// GET /api/faculty/dashboard/summary
// Real MongoDB data via Controller layer
// ======================================================
router.get('/dashboard/summary', isAuthenticated, requireOrganization, attachInstitutionProfile(), getFacultyDashboardData);

export default router;
