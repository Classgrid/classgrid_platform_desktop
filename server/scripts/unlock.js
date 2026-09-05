/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import connectDB from "./config/db.js";
import User from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    await connectDB();
    await User.updateOne(
        { email: "eng_admission@classgrid.in" },
        { $set: { lockUntil: null, loginAttempts: 0 } }
    );
    console.log("Unlocked eng_admission!");
    process.exit(0);
};
run();
