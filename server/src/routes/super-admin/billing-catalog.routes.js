/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import express from "express";
import * as CatalogController from "../../controllers/super-admin/billing-catalog.controller.js";

const router = express.Router();

// ── Plans ──
router.get("/plans", CatalogController.listPlans);
router.post("/plans", CatalogController.createPlan);
router.get("/plans/:planId", CatalogController.getPlan);
router.patch("/plans/:planId/eligibility", CatalogController.updatePlanEligibility);
router.post("/plans/:planId/versions", CatalogController.createPlanVersion);
router.get("/plans/:planId/versions", CatalogController.listPlanVersions);
router.post("/plans/:planId/archive", CatalogController.archivePlan);

// ── Modules ──
router.get("/modules", CatalogController.listModules);
router.post("/modules", CatalogController.createModule);
router.get("/modules/:moduleId", CatalogController.getModule);
router.patch("/modules/:moduleId/eligibility", CatalogController.updateModuleEligibility);
router.post("/modules/:moduleId/versions", CatalogController.createModuleVersion);
router.get("/modules/:moduleId/versions", CatalogController.listModuleVersions);
router.post("/modules/:moduleId/archive", CatalogController.archiveModule);

export default router;
