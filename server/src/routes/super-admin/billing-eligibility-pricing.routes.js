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

export default router;
