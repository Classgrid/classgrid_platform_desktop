import express from "express";
import * as Controller from "../../controllers/super-admin/billing-transactions.controller.js";

const router = express.Router();

router.get("/", Controller.listTransactions);
router.get("/:transactionId", Controller.getTransaction);

router.post("/:transactionId/recheck", Controller.recheckTransaction);
router.post("/:transactionId/refund", Controller.createRefund);
router.post("/:transactionId/refunds", Controller.createRefund);
router.post("/:transactionId/reconcile", Controller.reconcileTransaction);

router.get("/:transactionId/webhooks", Controller.getTransactionWebhooks);
router.get("/:transactionId/timeline", Controller.getTransactionTimeline);

export default router;
