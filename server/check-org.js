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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const orgSchema = new mongoose.Schema({
    name: String,
    type: String,
    org_type: String
}, { strict: false });

const Organization = mongoose.model("Organization", orgSchema, "organizations"); // guessing the collection name

async function checkOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const org = await Organization.findById("6a2d452b1c952d43497101c8").lean();
        
        if (org) {
            console.log("Organization found!");
            console.log("Name:", org.name);
            console.log("Type:", org.type || org.org_type || org.organizationType);
            console.log("Full Object:", JSON.stringify(org, null, 2));
        } else {
            console.log("Organization not found with that ID.");
        }

        mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
        mongoose.disconnect();
    }
}

checkOrg();
