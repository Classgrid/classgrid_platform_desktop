const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = (await import('./src/models/User.js')).default;
        const AiCreditTransaction = (await import('./src/models/AiCreditTransaction.js')).default;
        
        console.log('Deleting all AiCreditTransactions...');
        await AiCreditTransaction.deleteMany({});
        
        console.log('Resetting all user AI tokens and global flags...');
        await User.updateMany({}, {
            $set: {
                'ai_tokens.ai_credits_balance': 0,
                'ai_tokens.total_ai_credits_purchased': 0,
                'ai_tokens.total_ai_tokens_used': 0,
                'ai_tokens.promotion_credits_balance': 0,
                'ai_tokens.total_promotion_credits_granted': 0,
                'ai_tokens.used_this_week': 0,
                'ai_tokens.promotion_credits_paused': false,
                'ai_tokens.promotion_credits_revoked': false,
                'ai_tokens.promotion_credits_start_date': null,
                'ai_tokens.promotion_credits_end_date': null,
                'ai_tokens.ai_credits_start_date': null,
                'ai_tokens.ai_credits_end_date': null,
                'ai_tokens.paid_credit_pools': [],
                'ai_tokens.promotion_credit_pools': []
            }
        });
        
        console.log('All billing history, AI grants, and usage have been completely wiped.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
