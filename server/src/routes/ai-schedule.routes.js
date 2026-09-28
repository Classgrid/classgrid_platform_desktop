import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getMySchedules, cancelSchedule } from '../controllers/ai-schedule.controller.js';

const router = express.Router();

router.get('/', isAuthenticated, getMySchedules);
router.delete('/:id', isAuthenticated, cancelSchedule);

export default router;
