require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await sb.from('blog_subscribers').select('*').eq('email', 'bapugmane1951@gmail.com');
  console.log('DB Data:', data);
}
test();
