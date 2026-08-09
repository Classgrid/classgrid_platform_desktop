import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  const { data, error } = await supabase.from('blog_subscribers').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in DB:', Object.keys(data[0] || {}));
    console.log('Sample Data:', data[0]);
  }
}

checkColumns();
