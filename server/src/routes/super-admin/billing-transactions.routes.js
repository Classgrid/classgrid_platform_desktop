import express from "express";
import * as Controller from "../../controllers/super-admin/billing-transactions.controller.js";

const router = express.Router();

router.get("/transactions", Controller.listTransactions);
router.get("/transactions/:transactionId", Controller.getTransaction);

router.post("/transactions/:transactionId/recheck", Controller.recheckTransaction);
router.post("/transactions/:transactionId/refunds", Controller.createRefund);
router.post("/transactions/:transactionId/reconcile", Controller.reconcileTransaction);

router.get("/transactions/:transactionId/webhooks", Controller.getTransactionWebhooks);
router.get("/transactions/:transactionId/timeline", Controller.getTransactionTimeline);

export default router;
