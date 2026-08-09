import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_CHAT_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client once to bypass RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

/**
 * Synchronizes a newly created user (from MongoDB) into the Supabase blog_subscribers table.
 * If the user is already in the table, it safely ignores the insert.
 *
 * @param {string} email - The user's email address
 * @param {string} [name=""] - The user's name
 */
export async function syncUserToBlogSubscribers(email, name = "") {
    if (!email) return;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.warn("[Subscriber Sync] Supabase credentials missing. Skipping sync.");
        return;
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const firstName = (name || "").trim().split(/\s+/)[0] || "";

        // Attempt insert. If email already exists (violates unique constraint), Supabase returns an error which we catch or ignore.
        const { error } = await supabaseAdmin
            .from("blog_subscribers")
            .insert({
                email: normalizedEmail,
                name: firstName,
                is_active: true
            });
            
        // Ignore duplicate key errors (code 23505) because the user might already be subscribed via the blog.
        if (error && error.code !== "23505") {
            console.error(`[Subscriber Sync] Failed to sync ${normalizedEmail}:`, error.message);
        } else if (!error) {
            console.log(`[Subscriber Sync] Synced ${normalizedEmail} to blog_subscribers.`);
        }
    } catch (err) {
        console.error(`[Subscriber Sync] Exception syncing ${email}:`, err.message);
    }
}
