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
import crypto from "crypto";

const email = "gorekrushna82@gmail.com";
const secret = "classgrid_blog_webhook_2024_secret";

const hmac = crypto.createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
const md5 = crypto.createHash("md5").update(email).digest("hex");
const fallback = crypto.createHmac("sha256", "classgrid_fallback").update(email).digest("hex").slice(0, 32);

console.log("Token from URL:", "6b0b0ebf73cb3fa918c92e077716b4ac");
console.log("HMAC with new secret:", hmac);
console.log("MD5:", md5);
console.log("Fallback:", fallback);
