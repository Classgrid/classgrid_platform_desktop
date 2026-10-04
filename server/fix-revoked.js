import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/classgrid";

async function fixRevokedCredits() {
    await mongoose.connect(uri);
    console.log("Connected to DB");

    const AiCreditTransaction = (await import("./src/models/AiCreditTransaction.js")).default;
    const User = (await import("./src/models/User.js")).default;

    const allUsers = await User.find({ "ai_tokens": { $exists: true } });

    for (let user of allUsers) {
        // Find all transactions
        const txs = await AiCreditTransaction.find({ 
            userId: user._id, 
            type: { $in: ["grant", "pause", "resume", "extend", "revoke"] } 
        }).sort({ createdAt: -1 });

        if (txs.length > 0) {
            const lastTx = txs[0];
            if (lastTx.type === "revoke") {
                console.log(`Fixing revoked user ${user.email}`);
                
                // Find the original grant
                let originalLimit = 0;
                let originalStartDate = null;
                let originalEndDate = null;

                for (let tx of txs) {
                    if (tx.type === "grant") {
                        originalLimit += tx.credits_added;
                        originalStartDate = tx.createdAt; // roughly
                        originalEndDate = tx.createdAt; // we don't have the exact date in tx easily, but it's okay
                    }
                }

                if (originalLimit === 0) originalLimit = 4530000; // default fallback just in case

                await User.findByIdAndUpdate(user._id, {
                    $set: {
                        "ai_tokens.total_promotion_credits_granted": originalLimit,
                        "ai_tokens.promotion_credits_revoked": true
                    }
                });
            } else {
                 await User.findByIdAndUpdate(user._id, {
                    $set: {
                        "ai_tokens.promotion_credits_revoked": false
                    }
                });
            }
        }
    }
    console.log("Done");
    process.exit(0);
}

fixRevokedCredits().catch(console.error);
