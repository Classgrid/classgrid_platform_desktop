import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load the exact .env file from the server folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const resetTokens = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB!");

        // Import the User model properly
        const User = (await import('./src/models/User.js')).default;

        console.log("Resetting all used_this_week AI tokens back to 0...");
        
        // Update all users to have 0 tokens used
        const result = await User.updateMany(
            {}, 
            { $set: { "ai_tokens.used_this_week": 0 } }
        );

        console.log(`Successfully reset tokens for ${result.modifiedCount} users! You now have 1 Lakh tokens available again.`);
        process.exit(0);
    } catch (err) {
        console.error("Error resetting tokens:", err);
        process.exit(1);
    }
};

resetTokens();
