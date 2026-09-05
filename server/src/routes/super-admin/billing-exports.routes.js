/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import express from "express";
import * as Controller from "../../controllers/super-admin/billing-exports.controller.js";

const router = express.Router();

router.get("/:jobId", Controller.getExportJob);
router.get("/:jobId/download", Controller.getExportDownload);

export default router;
