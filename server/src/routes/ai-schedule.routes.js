// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getMySchedules, getScheduleById, cancelSchedule, updateSchedule } from '../controllers/ai-schedule.controller.js';

const router = express.Router();

router.get('/', isAuthenticated, getMySchedules);
router.get('/:id', isAuthenticated, getScheduleById);
router.delete('/:id', isAuthenticated, cancelSchedule);
router.put('/:id', isAuthenticated, updateSchedule);

export default router;

