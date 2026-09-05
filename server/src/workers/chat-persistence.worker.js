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

import IORedis from "ioredis";
import { flushChatStream } from "../services/socket.service.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isDev = process.env.NODE_ENV !== "production";

const redisClient = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: isDev,
    retryStrategy: (times) => {
        if (isDev) return null;
        return Math.min(times * 200, 3000);
    },
});

redisClient.on("error", () => {});

/**
 * The Adaptive Chat Worker
 * Runs periodically to flush Redis Streams into MongoDB for all active organizations.
 */
let isRunning = false;

const startChatWorker = () => {
    // Skip in dev if Redis is not available
    if (isDev) {
        console.log("👷 Adaptive Chat Worker skipped (no Redis in dev)");
        return;
    }

    // Run every 10 seconds
    setInterval(async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            // Find all chat streams
            let cursor = "0";
            const streamKeys = [];

            do {
                const [nextCursor, keys] = await redisClient.scan(
                    cursor,
                    "MATCH",
                    "chat:stream:org_*",
                    "COUNT",
                    100
                );
                cursor = nextCursor;
                streamKeys.push(...keys);
            } while (cursor !== "0");

            // Process each stream
            for (const key of streamKeys) {
                const orgId = key.split("org_")[1];
                if (orgId) {
                    await flushChatStream(orgId);
                }
            }
        } catch (error) {
            console.error("[Adaptive Worker] Error during periodic flush:", error);
        } finally {
            isRunning = false;
        }
    }, 10000); // 10 seconds interval

    console.log("👷 Adaptive Chat Worker Started (10s polling interval)");
};

startChatWorker();
