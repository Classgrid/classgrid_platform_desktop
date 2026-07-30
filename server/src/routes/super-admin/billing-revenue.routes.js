import express from "express";
import * as Controller from "../../controllers/super-admin/billing-revenue.controller.js";

const router = express.Router();

router.get("", Controller.getRevenueOverview);
router.get("/by-organization", Controller.getRevenueByOrganization);
router.get("/by-module", Controller.getRevenueByModule);
router.get("/by-invoice", Controller.getRevenueByInvoice);
router.get("/export", Controller.exportRevenue);
router.post("/export", Controller.exportRevenue);
router.post("/reconcile", Controller.reconcileRevenue);

export default router;
