import express from "express";
import * as Controller from "../../controllers/super-admin/billing-revenue.controller.js";

const router = express.Router();

router.get("/revenue", Controller.getRevenueOverview);
router.get("/revenue/by-organization", Controller.getRevenueByOrganization);
router.get("/revenue/by-module", Controller.getRevenueByModule);
router.get("/revenue/by-invoice", Controller.getRevenueByInvoice);
router.get("/revenue/export", Controller.exportRevenue);

export default router;
