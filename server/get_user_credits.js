import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

async function checkUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    const AiCreditTransaction = (await import("./server/src/models/AiCreditTransaction.js")).default;
    const User = (await import("./server/src/models/User.js")).default;
    
    // get the latest topup
    const txn = await AiCreditTransaction.findOne().sort({ createdAt: -1 }).lean();
    console.log("Latest Txn:", txn);
    
    if (txn) {
        const user = await User.findById(txn.userId).lean();
        console.log("User Tokens:", user.ai_tokens);
    }
    
    process.exit(0);
}

checkUser().catch(console.error);
