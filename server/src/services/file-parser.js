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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// IMPORTANT: pdf-parse v2 eagerly loads @napi-rs/canvas and DOMMatrix polyfills
// at require() time. These don't exist in Vercel's serverless Node.js environment,
// causing an immediate crash (ReferenceError: DOMMatrix is not defined).
// By lazy-loading inside the function, we avoid crashing at cold start.

// Cache the module once loaded successfully
let pdfModule = null;

export async function parsePDF(buffer) {
    try {
        if (!pdfModule) {
            pdfModule = require('pdf-parse');
        }
        const data = await pdfModule(buffer);
        // Limit to ~5 pages worth of text (roughly 15,000 chars) to prevent context overflow
        return data.text.substring(0, 15000);
    } catch (error) {
        console.error('PDF Parse Error:', error);

        // If it's the DOMMatrix/canvas error, give a clear message
        if (error.message && (error.message.includes('DOMMatrix') || error.message.includes('@napi-rs/canvas'))) {
            throw new Error('PDF parsing is not available in this environment. Please try a text-based upload instead.');
        }

        throw new Error('Failed to parse PDF file');
    }
}

