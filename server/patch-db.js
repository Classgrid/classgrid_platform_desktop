// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import PlatformTransaction from './src/models/PlatformTransaction.js';
import FailedPayment from './src/models/FailedPayment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
}).then(async () => {
    console.log("Connected to MongoDB.");

    // Fix FailedPayments
    const failed = await FailedPayment.find({ userName: { $in: [null, "Unknown", ""] }, "notes.user_id": { $exists: true } });
    console.log(`Found ${failed.length} failed payments to update.`);
    for (const f of failed) {
        const user = await User.findById(f.notes.user_id);
        if (user) {
            f.userName = user.name;
            f.userEmail = user.email;
            f.userMobile = user.mobileNumber || user.mobile;
            await f.save();
        }
    }

    // Fix PlatformTransactions
    const txs = await PlatformTransaction.find({ userName: { $in: [null, "Unknown", ""] }, "notes.user_id": { $exists: true } });
    console.log(`Found ${txs.length} successful transactions to update.`);
    for (const t of txs) {
        const user = await User.findById(t.notes.user_id);
        if (user) {
            t.userName = user.name;
            t.userEmail = user.email;
            t.userMobile = user.mobileNumber || user.mobile;
            await t.save();
        }
    }

    console.log("Database update complete.");
    process.exit(0);
}).catch(err => {
    console.error("Database connection failed", err);
    process.exit(1);
});
