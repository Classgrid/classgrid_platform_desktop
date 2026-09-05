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
import {
    createDemoAccount,
    getDemoAccounts,
    resetDemoPassword,
    loginAsDemo,
    deleteDemoAccount,
    exitImpersonation,
} from "../controllers/demo.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// All demo routes require super_admin or org_admin
router.post("/create", isAuthenticated, requireRole("super_admin", "org_admin"), createDemoAccount);
router.get("/list", isAuthenticated, requireRole("super_admin", "org_admin"), getDemoAccounts);
router.post("/:id/reset-password", isAuthenticated, requireRole("super_admin", "org_admin"), resetDemoPassword);
router.post("/:id/login-as", isAuthenticated, requireRole("super_admin", "org_admin"), loginAsDemo);
router.delete("/:id", isAuthenticated, requireRole("super_admin", "org_admin"), deleteDemoAccount);

// Exit impersonation (any authenticated user who is impersonating)
router.post("/exit-impersonation", isAuthenticated, exitImpersonation);

export default router;
