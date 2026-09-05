/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import express from "express";
import { 
    updateVideoProgress, 
    getClassroomVideoAnalytics, 
    getContinueWatching 
} from "../controllers/video.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.patch("/progress", isAuthenticated, updateVideoProgress);
router.get("/continue-watching", isAuthenticated, getContinueWatching);
router.get("/progress/:classroomId", isAuthenticated, getClassroomVideoAnalytics);

export default router;
