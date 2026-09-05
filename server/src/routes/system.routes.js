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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
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
