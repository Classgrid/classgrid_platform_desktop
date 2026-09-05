/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function checkPass() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await mongoose.connection.collection("users").findOne({ email: "eng_admin@classgrid.in" });
    console.log("mustResetPassword:", user.mustResetPassword);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

checkPass();
