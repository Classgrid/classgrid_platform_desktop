import express from "express";
import * as Controller from "../../controllers/super-admin/notification.controller.js";

const router = express.Router();

// Templates
router.get("/templates", Controller.listTemplates);
router.post("/templates", Controller.createTemplate);
router.get("/templates/:id", Controller.getTemplate);
router.put("/templates/:id", Controller.updateTemplate);
router.post("/templates/preview", Controller.previewTemplate);

// Logs
router.get("/logs", Controller.listLogs);
router.get("/logs/:id", Controller.getLogDetails);

export default router;
