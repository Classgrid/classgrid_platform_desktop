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

import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isDev = process.env.NODE_ENV !== "production";

const redis = new IORedis(REDIS_URL, {
  connectTimeout: 50000,
  maxRetriesPerRequest: null, // REQUIRED BY BULLMQ
  enableOfflineQueue: false,
  lazyConnect: isDev, // Don't auto-connect in dev if Redis isn't running
  retryStrategy: (times) => {
    if (isDev) return null; // Stop retrying entirely in local dev
    return Math.min(times * 200, 3000);
  },
});

redis.on("connect", () => {
  console.log("🟢 Redis Connected");
});

redis.on("error", () => {
  // Silenced — Redis is optional for local dev
});

redis.on("end", () => {
  if (!isDev) console.warn("🔴 Redis connection closed");
});

export default redis;
