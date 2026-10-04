import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const AiCreditTransaction = (await import('./server/src/models/AiCreditTransaction.js')).default;
        const User = (await import('./server/src/models/User.js')).default;
        
        const latestTxn = await AiCreditTransaction.findOne({ type: 'topup' }).sort({ createdAt: -1 });
        if (!latestTxn) {
            console.log("No topup transactions found");
            process.exit(0);
        }
        
        console.log("Latest Txn userId:", latestTxn.userId);
        
        const user = await User.findById(latestTxn.userId);
        console.log("User AI Tokens:");
        console.dir(user?.ai_tokens, { depth: null });
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
