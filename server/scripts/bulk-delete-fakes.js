import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_CHAT_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FAKE_EMAILS = [
  "jrc_hod@classgrid.in",
  "jrc_library@classgrid.in",
  "coaching_hod@classgrid.in",
  "coaching_library@classgrid.in",
  "coaching_fee@classgrid.in",
  "coaching_admission@classgrid.in",
  "coaching_faculty@classgrid.in",
  "coaching_student@classgrid.in",
  "coaching_admin@classgrid.in",
  "school_principal@classgrid.in",
  "school_hod@classgrid.in",
  "school_exam@classgrid.in",
  "school_library@classgrid.in",
  "school_fee@classgrid.in",
  "school_admission@classgrid.in",
  "school_faculty@classgrid.in",
  "school_student@classgrid.in",
  "school_admin@classgrid.in",
  "eng_principal@classgrid.in",
  "eng_hod@classgrid.in",
  "eng_exam@classgrid.in",
  "eng_library@classgrid.in",
  "eng_fee@classgrid.in",
  "eng_admission@classgrid.in",
  "eng_faculty@classgrid.in",
  "eng_student@classgrid.in",
  "eng_admin@classgrid.in",
  "mansondaughter7@gmail.com",
  "taken@example.com"
];

async function run() {
  console.log(`Deleting ${FAKE_EMAILS.length} fake emails...`);
  
  const { data, error } = await supabase
    .from("blog_subscribers")
    .delete()
    .in("email", FAKE_EMAILS);
    
  if (error) {
    console.error("Error deleting:", error);
  } else {
    console.log("Successfully deleted fake emails!");
  }
}

run();
