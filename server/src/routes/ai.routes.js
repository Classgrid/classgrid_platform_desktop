/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

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
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import { 
    indexMaterial, 
    chatWithSyllabus, 
    getMyPersona 
} from "../controllers/ai.controller.js";
import { streamAskAi, getChatSessions, getChatSession, getChatSessionMessages, uploadChatImage, updateChatSession, deleteChatSession, shareChatSession, createPublicShare, getPublicShare, submitAiFeedback, getAgentReviews, updateAgentReviewStatus, processAgentReviewsCron, deleteAgentReview, bulkDeleteAgentReviews, generateImage, getMyGeneratedImages, deleteGeneratedImage, getMyUsage, getOrgUsage } from "../controllers/ai-chat.controller.js";


const router = express.Router();

// ── SYLLABUS RAG ───────────────────────────────────────────

// Index a material (Admin/Teacher only)
router.post("/index-material", isAuthenticated, requireRole("teacher", "super-admin"), indexMaterial);

// Chat with indexed syllabus
router.post("/syllabus-chat", isAuthenticated, chatWithSyllabus);

// ── STUDENT PERSONA ────────────────────────────────────────

// Get personalized AI insights
router.get("/my-persona", isAuthenticated, getMyPersona);

// ── GLOBAL AI ASSISTANT ────────────────────────────────────

// Global AI Panel SSE Chat
router.post("/ask", isAuthenticated, streamAskAi);
router.post("/feedback", isAuthenticated, submitAiFeedback);
router.get("/agent-reviews", isAuthenticated, getAgentReviews);
router.put("/agent-reviews/:id/status", isAuthenticated, updateAgentReviewStatus);
router.delete("/agent-reviews/:id", isAuthenticated, deleteAgentReview);
router.post("/agent-reviews/bulk-delete", isAuthenticated, bulkDeleteAgentReviews);
router.get("/cron-process-reviews", processAgentReviewsCron);

// Image Generation
router.post("/generate-image", isAuthenticated, generateImage);
router.get("/my-images", isAuthenticated, getMyGeneratedImages);
router.delete("/my-images/:id", isAuthenticated, deleteGeneratedImage);

// Token Usage Tracking
router.get("/my-usage", isAuthenticated, getMyUsage);
router.get("/org-usage", isAuthenticated, getOrgUsage);

// Chat History & Sessions
router.get("/sessions", isAuthenticated, getChatSessions);
router.get("/sessions/:id", isAuthenticated, getChatSession);
router.get("/sessions/:id/messages", isAuthenticated, getChatSessionMessages);
router.put("/sessions/:id", isAuthenticated, updateChatSession);
router.delete("/sessions/:id", isAuthenticated, deleteChatSession);
router.post("/sessions/:id/share", isAuthenticated, shareChatSession);
router.post("/sessions/:id/public-share", isAuthenticated, createPublicShare);

// Public shared chat viewer (NO auth required)
router.get("/shared/:shareId", getPublicShare);

// R2 Image Upload for Chat
router.post("/upload", isAuthenticated, uploadChatImage);

export default router;
