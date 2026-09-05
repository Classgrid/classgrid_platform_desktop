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

import nodeCron from "node-cron";
import connectDB from "../../config/db.js";
import { processDueScheduledNotifications } from "../services/scheduled-notification.service.js";

export function initScheduledNotificationWorker() {
    let isRunning = false;

    nodeCron.schedule("* * * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            await connectDB();
            const stats = await processDueScheduledNotifications();
            if (stats.checked > 0 || stats.sent > 0 || stats.failed > 0) {
                console.log(
                    `[ScheduledNotification] processed: checked=${stats.checked} sent=${stats.sent} failed=${stats.failed} skipped=${stats.skipped}`
                );
            }
        } catch (err) {
            console.error("[ScheduledNotification] worker error:", err.message);
        } finally {
            isRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });

    console.log("Scheduled notification worker initialized.");
}
