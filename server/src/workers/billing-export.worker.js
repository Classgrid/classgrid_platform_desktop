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

import nodeCron from "node-cron";
import connectDB from "../../config/db.js";
import { processBillingExportJobs } from "../services/billing-export.service.js";

export function initBillingExportWorker() {
    let isRunning = false;
    nodeCron.schedule("* * * * *", async () => {
        if (isRunning) return;
        isRunning = true;
        try {
            await connectDB();
            const stats = await processBillingExportJobs();
            if (stats.processed) {
                console.log(`[BillingExport] processed=${stats.processed} completed=${stats.completed} failed=${stats.failed}`);
            }
        } catch (error) {
            console.error("[BillingExport] worker error:", error.message);
        } finally {
            isRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });
    console.log("Billing export worker initialized.");
}
