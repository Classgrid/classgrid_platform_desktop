import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

import { primarySupabaseClient as supabase } from './server/src/config/supabaseClient.js';

async function run() {
  console.log('Connected to Supabase. Attempting to delete test emails...');
  
  // Delete all test student emails
  const { data, error } = await supabase
    .from('blog_subscribers')
    .delete()
    .like('email', '%@example.com');
    
  if (error) {
    console.error('Error deleting example.com emails:', error);
  } else {
    console.log('Successfully deleted all @example.com subscribers.');
  }
  
  process.exit(0);
}

run();
