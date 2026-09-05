/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

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
