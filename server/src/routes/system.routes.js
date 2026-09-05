/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * GET /api/system/status
 * Proxies the statuspage.io JSON to avoid client-side CORS issues.
 */
router.get("/status", async (req, res) => {
  try {
    const pageId = req.query.pageId || "status.classgrid.in";
    // If pageId contains a dot, it's a custom domain (e.g. status.classgrid.in on Incident.io)
    let url = `https://${pageId}.statuspage.io/api/v2/summary.json`;
    if (pageId.includes('.')) {
      url = `https://${pageId}/api/v2/summary.json`;
    }
    const response = await axios.get(url);
    
    return res.json(response.data);
  } catch (error) {
    console.error("[System] status fetch error:", error?.message);
    return res.status(error?.response?.status || 500).json({ success: false, message: "Internal proxy error" });
  }
});

export default router;
