// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getMySchedules, getScheduleById, cancelSchedule, updateSchedule } from '../controllers/ai-schedule.controller.js';

const router = express.Router();

router.get('/', isAuthenticated, getMySchedules);
router.get('/:id', isAuthenticated, getScheduleById);
router.delete('/:id', isAuthenticated, cancelSchedule);
router.put('/:id', isAuthenticated, updateSchedule);

export default router;

