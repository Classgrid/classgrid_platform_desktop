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
import * as Controller from "../../controllers/super-admin/billing-subscription.controller.js";

const router = express.Router();

router.get("", Controller.listSubscriptions);
router.get("/overview", Controller.getSubscriptionOverview);
router.get("/:organizationId", Controller.getSubscription);

router.post("/:organizationId/preview", Controller.previewSubscriptionChange);
router.post("/:organizationId/assign-plan", Controller.assignPlan);
router.post("/:organizationId/change-plan", Controller.changePlan);
router.post("/:organizationId/add-module", Controller.addModule);
router.post("/:organizationId/remove-module", Controller.removeModule);
router.post("/:organizationId/change-cycle", Controller.changeBillingCycle);
router.post("/:organizationId/pause", Controller.pauseSubscription);
router.post("/:organizationId/resume", Controller.resumeSubscription);
router.post("/:organizationId/cancel", Controller.cancelSubscription);

router.get("/:organizationId/history", Controller.getSubscriptionHistory);
router.get("/:organizationId/upcoming-invoice", Controller.getUpcomingInvoice);

export default router;
