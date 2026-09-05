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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

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
