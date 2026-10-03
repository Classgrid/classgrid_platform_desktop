// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './src/models/User.js';
async function run() {
  await connectDB();
  const users = await User.find({ microsoft_access_token: { $ne: null } }, 'email');
  console.log('Users with token:', users);
  process.exit(0);
}
run();
