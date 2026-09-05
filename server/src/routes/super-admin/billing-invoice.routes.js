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
import * as Controller from "../../controllers/super-admin/billing-invoice.controller.js";

const router = express.Router();

router.get("", Controller.listInvoices);
router.get("/:invoiceId", Controller.getInvoice);

router.post("/preview", Controller.previewInvoice);
router.post("/generate", Controller.generateInvoice);
router.post("/:invoiceId/issue", Controller.issueInvoice);
router.post("/:invoiceId/send", Controller.sendInvoice);
router.post("/:invoiceId/void", Controller.voidInvoice);
router.post("/:invoiceId/credit-notes", Controller.createCreditNote);

router.get("/:invoiceId/pdf", Controller.downloadInvoicePdf);
router.get("/:invoiceId/delivery-history", Controller.getDeliveryHistory);

export default router;
