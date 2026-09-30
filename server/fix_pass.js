// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
import { MongoClient } from 'mongodb'; async function fix() { const client = new MongoClient('mongodb://localhost:27017/classgrid'); await client.connect(); const db = client.db(); const res = await db.collection('User').updateOne({ email: 'nikhilsubsun321@gmail.com' }, { $set: { password: '.7IoLkV0ASAPGbcYNa' } }); console.log('Update result:', res); await client.close(); } fix().catch(console.error);