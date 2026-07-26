import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_CHAT_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  "https://bumxgscngzjadyozdpce.supabase.co";

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_CHAT_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance && SUPABASE_URL && SUPABASE_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'classgrid-sb-key' },
    });
  }
  return supabaseInstance;
}
