/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model("User", userSchema, "users");
    
    const email = "eng_admin@classgrid.in";
    const newPassword = "password123";
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`Password reset for ${email}. Modified count: ${result.modifiedCount}`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
  }
}

resetAdminPassword();
