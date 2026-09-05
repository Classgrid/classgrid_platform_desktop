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

import nodeCron from "node-cron";
import connectDB from "../../config/db.js";
import { calculateOrganizationUsageDaily } from "../services/organization-usage-metering.service.js";

export function initOrganizationUsageDailyWorker() {
    let isRunning = false;

    nodeCron.schedule("20 0 * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            await connectDB();
            const result = await calculateOrganizationUsageDaily({ date: new Date() });
            console.log(
                `[UsageDaily] complete: day=${result.day} inserted=${result.inserted} duplicateSkipped=${result.duplicateSkipped} r2Objects=${result.scannedR2Objects} unmapped=${result.unmappedR2Objects}`
            );
        } catch (err) {
            console.error("[UsageDaily] worker error:", err.message);
        } finally {
            isRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });

    console.log("Organization daily usage worker initialized.");
}
