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

dotenv.config();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    additional_roles: [String],
    organization_id: mongoose.Schema.Types.ObjectId,
});

const User = mongoose.model("User", userSchema);

async function checkRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const users = await User.find({ role: "super_admin" }).select("name email role additional_roles").lean();
        console.log(`Found ${users.length} super_admins.`);
        
        for (const u of users) {
            console.log(`- ${u.name} (${u.email}) | Role: ${u.role} | Addl: ${u.additional_roles}`);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
        mongoose.disconnect();
    }
}

checkRoles();
