/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
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
