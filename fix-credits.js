import mongoose from 'mongoose';
import User from './server/src/models/User.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/classgrid');
  
  const usersToFix = await User.find({ 'ai_tokens.ai_credits_balance': { $gt: 0 } });
  
  for (let user of usersToFix) {
    if (!user.ai_tokens.total_ai_credits_purchased || user.ai_tokens.total_ai_credits_purchased === 0) {
       console.log('Fixing user:', user.email, 'balance:', user.ai_tokens.ai_credits_balance);
       user.ai_tokens.total_ai_credits_purchased = user.ai_tokens.ai_credits_balance;
       await user.save();
    }
  }
  
  console.log('Done fixing old records');
  process.exit(0);
}

run();
