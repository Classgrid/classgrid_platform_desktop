const axios = require('axios');

async function test() {
  try {
    const email = 'swaroop10041@gmail.com';
    console.log(`Patching ${email}...`);
    // Need to authenticate as super admin or test directly against Supabase?
    // Let's just run the exact update query that the backend runs!
    
    require('dotenv').config();
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { error, data } = await sb
      .from('blog_subscribers')
      .update({ receives_blog: false })
      .eq('email', email)
      .select();
      
    console.log('Update result:', data);
  } catch (err) {
    console.error(err);
  }
}

test();
