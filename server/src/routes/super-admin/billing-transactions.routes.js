/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

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
