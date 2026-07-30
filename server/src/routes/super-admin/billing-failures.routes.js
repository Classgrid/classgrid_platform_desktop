import express from "express";
import * as Controller from "../../controllers/super-admin/billing-failures.controller.js";

const router = express.Router();

router.get("", Controller.listFailedPayments);
router.get("/overview", Controller.getFailureOverview);
router.get("/:failureId", Controller.getFailedPayment);

router.post("/:failureId/generate-payment-link", Controller.generatePaymentLink);
router.post("/:failureId/retry-webhook", Controller.retryWebhook);
router.post("/:failureId/recheck-provider", Controller.recheckProvider);
router.post("/:failureId/assign", Controller.assignFailure);
router.post("/:failureId/add-note", Controller.addFailureNote);
router.post("/:failureId/resolve", Controller.resolveFailure);

export default router;
