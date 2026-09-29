import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { getMyAiBalance, getMyTopUpHistory } from "../controllers/ai-credits.controller.js";

const router = express.Router();

/**
 * PHASE 14: End User AI Credits Routes
 * Mounted at: /api/ai/credits
 */

router.get("/balance", isAuthenticated, getMyAiBalance);
router.get("/history", isAuthenticated, getMyTopUpHistory);

export default router;
