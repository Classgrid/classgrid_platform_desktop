// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PlatformTransaction from './src/models/PlatformTransaction.js';
import PaymentFailure from './src/models/PaymentFailure.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
}).then(async () => {
    console.log("Connected to MongoDB. Deleting all backend transactions and failed payments...");

    const txRes = await PlatformTransaction.deleteMany({});
    console.log(`Deleted ${txRes.deletedCount} transactions from PlatformTransaction collection.`);

    const failRes = await PaymentFailure.deleteMany({});
    console.log(`Deleted ${failRes.deletedCount} failed payments from PaymentFailure collection.`);

    console.log("Deletion complete.");
    process.exit(0);
}).catch(err => {
    console.error("Database connection failed", err);
    process.exit(1);
});
