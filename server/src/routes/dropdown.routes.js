/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import express from 'express';
import { getDropdowns } from '../controllers/dropdown.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Fetch dropdown options, optionally filtered by organization type, role category, or parent ids
// Requires auth so we know the user's current organization
router.get('/', isAuthenticated, getDropdowns);

export default router;
