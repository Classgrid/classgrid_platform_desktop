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

import { 
    getAgoraToken, 
    startMeeting, 
    joinMeeting, 
    endMeeting,
    getMeetingHistory,
    getRtmToken,
    startRecording,
    stopRecording,
    updateGoLiveDetails
} from "../controllers/live.controller.js";
import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate-token", isAuthenticated, getAgoraToken);
router.post("/generate-rtm-token", isAuthenticated, getRtmToken);
router.post("/start", isAuthenticated, startMeeting);
router.post("/join/:meetingId", isAuthenticated, joinMeeting);
router.post("/end/:meetingId", isAuthenticated, endMeeting);
router.get("/history/:classroomId", isAuthenticated, getMeetingHistory);

// Recording
router.post("/meeting/:meetingId/start-recording", isAuthenticated, startRecording);
router.post("/meeting/:meetingId/stop-recording", isAuthenticated, stopRecording);
// Edit Recording Playlist/Details Post-Meeting
router.put("/:meetingId", isAuthenticated, updateGoLiveDetails);

export default router;
