const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = (await import('./src/models/User.js')).default;
        
        const user = await User.findOne({ name: 'romantic' });
        if (!user) { console.log('User not found'); return; }
        
        console.log('Before:');
        console.log('  promotion_credits_revoked:', user.ai_tokens?.promotion_credits_revoked);
        console.log('  promotion_credits_paused:', user.ai_tokens?.promotion_credits_paused);
        
        // Clear stale global flags - we now use per-transaction status
        await User.findByIdAndUpdate(user._id, {
            $unset: {
                'ai_tokens.promotion_credits_revoked': '',
                'ai_tokens.promotion_credits_paused': ''
            }
        });
        
        console.log('Cleared stale global flags!');
    } catch (e) { 
        console.error(e); 
    } finally { 
        process.exit(0); 
    }
}
run();
