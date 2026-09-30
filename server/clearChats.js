import { primarySupabaseClient } from './src/config/supabaseClient.js';

async function clear() {
    await primarySupabaseClient.from('ai_chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await primarySupabaseClient.from('ai_chat_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('All chats cleared successfully!');
}
clear();
