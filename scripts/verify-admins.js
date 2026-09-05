/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const users = db.collection("users");

const res = await users.updateMany(
  { role: "org_admin" },
  { $set: { isEmailVerified: true, verification_status: "verified", status: "active" } }
);

console.log(`✅ Updated ${res.modifiedCount} admin users to verified status`);

await mongoose.disconnect();
process.exit(0);
