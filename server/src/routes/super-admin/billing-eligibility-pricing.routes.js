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
import * as Controller from "../../controllers/super-admin/billing-eligibility-pricing.controller.js";

const router = express.Router();

// ── Eligibility Rules ──
router.get("/eligibility-rules", Controller.listEligibilityRules);
router.post("/eligibility-rules", Controller.createEligibilityRule);
router.patch("/eligibility-rules/:ruleId", Controller.updateEligibilityRule);

// ── Metrics & Usage ──
router.get("/metrics", Controller.listMetrics);
router.get("/organizations/:organizationId/usage", Controller.getUsage);
router.post("/organizations/:organizationId/recalculate-usage", Controller.recalculateUsage);

// ── Price Overrides ──
router.get("/organizations/:organizationId/price-overrides", Controller.listPriceOverrides);
router.post("/organizations/:organizationId/price-overrides", Controller.createPriceOverride);
router.patch("/price-overrides/:overrideId", Controller.updatePriceOverride);
router.delete("/price-overrides/:overrideId", Controller.deletePriceOverride);

export default router;
