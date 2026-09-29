import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { initiateAiTopUp } from "../controllers/ai-topup.controller.js";
import { generalLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * PHASE 13: Top-Up Routes
 * Mounted at: /api/ai/topup
 */

// Initiates the top-up process and hands off to billing.classgrid.in
router.post("/initiate", generalLimiter, isAuthenticated, initiateAiTopUp);

export default router;
