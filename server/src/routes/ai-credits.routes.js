import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { getMyCredits, getMyPurchaseHistory, getMyUsage } from "../controllers/ai-credits.controller.js";

const router = express.Router();

/**
 * PHASE 14: End User AI Credits Routes
 * Mounted at: /api/ai/credits
 */

router.get("/balance", isAuthenticated, getMyCredits);
router.get("/history", isAuthenticated, getMyPurchaseHistory);
router.get("/usage", isAuthenticated, getMyUsage);

export default router;
