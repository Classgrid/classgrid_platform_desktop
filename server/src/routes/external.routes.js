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

import express from "express";
import { markBiometricAttendance } from "../controllers/external.controller.js";
import { verifyBiometricDevice } from "../middleware/biometricAuth.middleware.js";
import { rateLimit } from "express-rate-limit";

const router = express.Router();

// Allow moderate limit for hardware devices (turnstile scanners send bulk requests sometimes)
const hardwareRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // limit each IP to 300 requests per windowMs
    message: { success: false, message: "Too many biometric pushes from this IP" },
});

// Biometric attendance webhook
router.post(
    "/faculty/attendance",
    hardwareRateLimiter,
    verifyBiometricDevice,
    markBiometricAttendance
);

export default router;
