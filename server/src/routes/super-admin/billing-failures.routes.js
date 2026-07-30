import express from "express";
import * as Controller from "../../controllers/super-admin/billing-failures.controller.js";

const router = express.Router();

router.get("/failed-payments", Controller.listFailedPayments);
router.get("/failed-payments/overview", Controller.getFailureOverview);
router.get("/failed-payments/:failureId", Controller.getFailedPayment);

router.post("/failed-payments/:failureId/generate-payment-link", Controller.generatePaymentLink);
router.post("/failed-payments/:failureId/retry-webhook", Controller.retryWebhook);
router.post("/failed-payments/:failureId/recheck-provider", Controller.recheckProvider);
router.post("/failed-payments/:failureId/assign", Controller.assignFailure);
router.post("/failed-payments/:failureId/add-note", Controller.addFailureNote);
router.post("/failed-payments/:failureId/resolve", Controller.resolveFailure);

export default router;
