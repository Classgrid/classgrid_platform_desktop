import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const set1Crore = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = (await import('./src/models/User.js')).default;
        const Organization = (await import('./src/models/Organization.js')).default;

        await User.updateMany({ email: /nikhil/i }, { 
            $set: { 
                "ai_tokens.used_this_week": 0,
                "ai_tokens.free_weekly_limit": 10000000 
            } 
        });
        
        await Organization.updateMany({}, { 
            $set: { 
                "ai_config.pro_used_this_period": 0,
                "ai_config.pro_pool_limit": 10000000 
            } 
        });

        console.log("Successfully set Nikhil's limit to exactly 1 Crore (10,000,000) tokens!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

set1Crore();
