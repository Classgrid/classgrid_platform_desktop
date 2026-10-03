// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import express from "express";
import { getAiUsageStats, resetCredits, toggleBlockAi } from "../../controllers/super-admin/ai-admin.controller.js";
import { requireAuth, requireSuperAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require Super Admin privileges
router.use(requireAuth);
router.use(requireSuperAdmin);

router.get("/usage", getAiUsageStats);
router.post("/reset-credits", resetCredits);
router.post("/block", toggleBlockAi);

export default router;
