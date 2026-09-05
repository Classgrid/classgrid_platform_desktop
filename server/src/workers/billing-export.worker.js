/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
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
