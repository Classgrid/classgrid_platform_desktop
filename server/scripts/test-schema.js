/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import { getFormSchema } from "./src/services/admissions/admission-form-builder.service.js";

try {
    const schema = getFormSchema({ structure_type: "school_no_div" });
    console.log("SUCCESS:", schema.sections.length);
} catch (e) {
    console.error("CRASH:", e);
}
