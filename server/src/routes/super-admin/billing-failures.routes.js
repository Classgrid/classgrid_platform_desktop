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
import * as Controller from "../../controllers/super-admin/billing-failures.controller.js";

const router = express.Router();

router.get("", Controller.listFailedPayments);
router.get("/overview", Controller.getFailureOverview);
router.get("/:failureId", Controller.getFailedPayment);

router.post("/:failureId/generate-payment-link", Controller.generatePaymentLink);
router.post("/:failureId/retry-webhook", Controller.retryWebhook);
router.post("/:failureId/recheck-provider", Controller.recheckProvider);
router.post("/:failureId/notify-organization", Controller.notifyOrganization);
router.post("/:failureId/diagnostic-export", Controller.exportDiagnostic);
router.post("/:failureId/assign", Controller.assignFailure);
router.post("/:failureId/add-note", Controller.addFailureNote);
router.post("/:failureId/resolve", Controller.resolveFailure);

export default router;
