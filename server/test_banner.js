/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import { primarySupabaseClient } from './src/config/supabaseClient.js';

async function test() {
  const { data, error } = await primarySupabaseClient.rpc('exec_sql', { sql: 'ALTER TABLE chat_groups ADD COLUMN banner_url text;' });
  console.log("Result:", data, error);
}

test();
