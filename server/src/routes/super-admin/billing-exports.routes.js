import express from "express";
import * as Controller from "../../controllers/super-admin/billing-exports.controller.js";

const router = express.Router();

router.get("/:jobId", Controller.getExportJob);
router.get("/:jobId/download", Controller.getExportDownload);

export default router;
