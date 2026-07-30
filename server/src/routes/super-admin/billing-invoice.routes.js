import express from "express";
import * as Controller from "../../controllers/super-admin/billing-invoice.controller.js";

const router = express.Router();

router.get("/invoices", Controller.listInvoices);
router.get("/invoices/:invoiceId", Controller.getInvoice);

router.post("/invoices/preview", Controller.previewInvoice);
router.post("/invoices/generate", Controller.generateInvoice);
router.post("/invoices/:invoiceId/issue", Controller.issueInvoice);
router.post("/invoices/:invoiceId/send", Controller.sendInvoice);
router.post("/invoices/:invoiceId/void", Controller.voidInvoice);
router.post("/invoices/:invoiceId/credit-notes", Controller.createCreditNote);

router.get("/invoices/:invoiceId/pdf", Controller.downloadInvoicePdf);
router.get("/invoices/:invoiceId/delivery-history", Controller.getDeliveryHistory);

export default router;
