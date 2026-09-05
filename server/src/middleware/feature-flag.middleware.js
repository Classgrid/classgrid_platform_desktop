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

import mongoose from "mongoose";
import { findBlockingFeatureFlag, platformAccessGate } from "../services/feature-flag.service.js";

export const enforceFeatureFlags = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) return next();
        const organizationId = req.user?.organizationId || req.org?._id || req.body?.organizationId;
        const organizationType = req.user?.organizationType || req.org?.org_type;

        const blockingFlag = await findBlockingFeatureFlag({
            requestPath: req.originalUrl || req.path,
            organizationId,
            organizationType
        });

        if (blockingFlag) {
            return res.status(403).json({
                success: false,
                code: "FEATURE_DISABLED",
                feature: blockingFlag.key,
                message: `The ${blockingFlag.name} feature is currently disabled.`
            });
        }
        next();
    } catch (error) {
        console.error("[FeatureFlags] Enforcement check failed:", error);
        next(); // Fail open so we don't break the whole platform
    }
};

export { platformAccessGate };
