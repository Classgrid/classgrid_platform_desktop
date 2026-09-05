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

import express from "express";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import { 
    indexMaterial, 
    chatWithSyllabus, 
    getMyPersona 
} from "../controllers/ai.controller.js";

const router = express.Router();

// ── SYLLABUS RAG ───────────────────────────────────────────

// Index a material (Admin/Teacher only)
router.post("/index-material", isAuthenticated, requireRole("teacher", "super-admin"), indexMaterial);

// Chat with indexed syllabus
router.post("/syllabus-chat", isAuthenticated, chatWithSyllabus);

// ── STUDENT PERSONA ────────────────────────────────────────

// Get personalized AI insights
router.get("/my-persona", isAuthenticated, getMyPersona);

export default router;
