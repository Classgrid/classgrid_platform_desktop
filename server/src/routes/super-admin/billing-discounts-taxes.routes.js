import express from "express";
import * as Controller from "../../controllers/super-admin/billing-discounts-taxes.controller.js";

const router = express.Router();

// ── Discounts ──
router.get("/discounts", Controller.listDiscounts);
router.post("/discounts", Controller.createDiscount);
router.patch("/discounts/:discountId", Controller.updateDiscount);
router.post("/discounts/:discountId/archive", Controller.archiveDiscount);

// ── Credits ──
router.get("/organizations/:organizationId/credits", Controller.getCreditAccount);
router.post("/organizations/:organizationId/credits/grant", Controller.grantCredits);
router.post("/organizations/:organizationId/credits/reverse", Controller.reverseCredits);

// ── Taxes ──
router.get("/tax-rules", Controller.listTaxRules);
router.post("/tax-rules", Controller.createTaxRule);
router.get("/tax-rules/:taxRuleId/versions", Controller.listTaxRuleVersions);
router.post("/tax-rules/:taxRuleId/versions", Controller.createTaxRuleVersion);

export default router;
