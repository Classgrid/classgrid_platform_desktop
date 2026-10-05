import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const AiCreditTransaction = (await import('./src/models/AiCreditTransaction.js')).default;
        
        const indexes = await AiCreditTransaction.collection.indexes();
        console.log("Indexes:");
        console.dir(indexes, { depth: null });
        
        const duplicates = await AiCreditTransaction.find({ type: "topup" }).sort({ createdAt: -1 }).limit(10);
        console.log("Recent Top-Ups:");
        duplicates.forEach(d => console.log(d._id, d.razorpay_payment_id, d.amount_inr, d.createdAt));
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
