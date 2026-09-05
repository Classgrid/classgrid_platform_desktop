/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fallbackLoaded = false;
let blogSubscribersClient = null;

function loadMarketingEnvFallback() {
    if (fallbackLoaded) return;
    fallbackLoaded = true;

    if (process.env.BLOG_SUPABASE_URL && process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY) {
        return;
    }

    if (process.env.NODE_ENV === "production") {
        return;
    }

    const fallbackEnvPath = path.resolve(__dirname, "../../../../../classgrid_marketting/.env.local");

    if (fs.existsSync(fallbackEnvPath)) {
        dotenv.config({ path: fallbackEnvPath, override: false });
    }
}

export function getBlogSubscribersSb() {
    loadMarketingEnvFallback();

    const blogUrl = process.env.BLOG_SUPABASE_URL || "https://bumxgscngzjadyozdpce.supabase.co";
    const blogServiceKey = process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXhnc2NuZ3pqYWR5b3pkcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM3NDgzNSwiZXhwIjoyMDg2OTUwODM1fQ.NP6osv-1ewQ7254Lf9ikLeJ-oZTTZKDO8UIkamKr3ww";

    if (!blogUrl || !blogServiceKey) {
        throw new Error("Blog subscriber Supabase credentials are not configured.");
    }

    if (!blogSubscribersClient) {
        blogSubscribersClient = createClient(blogUrl, blogServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return blogSubscribersClient;
}
