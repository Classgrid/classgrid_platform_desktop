import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const AiUsageLog = (await import('./src/models/AiUsageLog.js')).default;
    const User = (await import('./src/models/User.js')).default;
    
    // Find Nikhil
    const nikhil = await User.findOne({ email: /nikhil/i });
    if (!nikhil) {
        console.log("Nikhil not found");
        process.exit(1);
    }
    
    console.log("Nikhil ID:", nikhil._id);
    console.log("Nikhil Total Tokens:", nikhil.ai_tokens?.total_ai_tokens_used);
    
    const logs = await AiUsageLog.find({ userId: nikhil._id }).sort({ createdAt: -1 }).limit(5);
    console.log("Recent logs for Nikhil:", logs.length);
    if (logs.length > 0) {
        console.log("Latest log date:", logs[0].createdAt);
    }
    
    const allLogsLast3Days = await AiUsageLog.find({ 
        createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } 
    }).populate('userId', 'name email');
    
    console.log("\nAll users in AiUsageLog from last 3 days:");
    const usersCount = {};
    for(let l of allLogsLast3Days) {
        let name = l.userId ? l.userId.name : 'Unknown';
        usersCount[name] = (usersCount[name] || 0) + 1;
    }
    console.log(usersCount);
    
    process.exit(0);
}).catch(console.error);
