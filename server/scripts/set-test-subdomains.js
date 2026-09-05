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
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname.slice(1) });
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
await mongoose.connect(MONGO_URI);
console.log("✅ Connected");

const db = mongoose.connection.db;
const orgs = db.collection("organizations");

const updates = [
    { _id: new mongoose.Types.ObjectId("6a2d45442e720333c3ab5bb7"), subdomain: "aps" },
    { _id: new mongoose.Types.ObjectId("6a2d454a2e720333c3ab5c07"), subdomain: "ajc" },
    { _id: new mongoose.Types.ObjectId("6a2d452b1c952d43497101c8"), subdomain: "aec" },
    { _id: new mongoose.Types.ObjectId("6a2d45472e720333c3ab5be1"), subdomain: "acc" },
];

for (const u of updates) {
    await orgs.updateOne({ _id: u._id }, { $set: { subdomain: u.subdomain } });
}

const results = await orgs.find({}, { projection: { name: 1, subdomain: 1, org_type: 1 } }).toArray();
console.log("\n📋 Updated subdomains:");
results.forEach(o => console.log(`   ${o.name} → ${o.subdomain}.classgrid.in (${o.org_type})`));

await mongoose.disconnect();
process.exit(0);
