import express from 'express';
import { getDropdowns } from '../controllers/dropdown.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Fetch dropdown options, optionally filtered by organization type, role category, or parent ids
// Requires auth so we know the user's current organization
router.get('/', isAuthenticated, getDropdowns);

export default router;
