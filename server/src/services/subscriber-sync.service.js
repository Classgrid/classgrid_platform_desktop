import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_CHAT_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabaseAdmin;
}

/**
 * Synchronizes a newly created user (from MongoDB) into the Supabase blog_subscribers table.
 * If the user is already in the table, it safely ignores the insert.
 *
 * @param {string} email - The user's email address
 * @param {string} [name=""] - The user's name
 */
export async function syncUserToBlogSubscribers(email, name = "") {
    if (!email) return;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        console.warn("[Subscriber Sync] Supabase credentials missing. Skipping sync.");
        return;
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const firstName = (name || "").trim().split(/\s+/)[0] || "";

        const { error } = await supabaseAdmin
            .from("blog_subscribers")
            .insert({
                email: normalizedEmail,
                name: firstName,
                receives_blog: false,
                receives_changelog: false,
                receives_legal: true
            });
            
        // Ignore duplicate key errors (code 23505) — user already subscribed via blog
        if (error && error.code !== "23505") {
            console.error(`[Subscriber Sync] Failed to sync ${normalizedEmail}:`, error.message);
        } else if (!error) {
            console.log(`[Subscriber Sync] ✅ Synced ${normalizedEmail} to blog_subscribers.`);
        }
    } catch (err) {
        console.error(`[Subscriber Sync] Exception syncing ${email}:`, err.message);
    }
}
