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
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const corsParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    CORSConfiguration: {
        CORSRules: [
            {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                AllowedOrigins: [
                    "http://localhost:5173", 
                    "http://localhost:3000",
                    "https://classgrid.in", 
                    "https://*.classgrid.in", 
                    "https://quantumchem.site", 
                    "https://opus.quantumchem.site",
                    "https://vertexedu.komal.engineer"
                ],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3600,
            },
        ],
    },
};

async function updateCors() {
    try {
        console.log("Updating CORS configuration for R2 bucket:", process.env.R2_BUCKET_NAME);
        const command = new PutBucketCorsCommand(corsParams);
        await r2.send(command);
        console.log("✅ Successfully updated CORS configuration!");
    } catch (err) {
        console.error("❌ Error updating CORS configuration:", err);
    }
}

updateCors();
