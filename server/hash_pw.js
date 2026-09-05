/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import bcrypt from 'bcryptjs';
async function run() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Nikhil@5049", salt);
    console.log("HASH:", hash);
}
run();
