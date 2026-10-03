// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const AiUsageLog = (await import('./src/models/AiUsageLog.js')).default;
    const logs = await AiUsageLog.find({ promptTokens: 0, totalTokens: { $gt: 0 } });
    console.log('Found logs with 0 prompt but >0 total:', logs.length);
    
    let updated = 0;
    for (let log of logs) {
        // approximate 20% prompt, 80% completion for historical data
        let pTokens = Math.floor(log.totalTokens * 0.2);
        let cTokens = log.totalTokens - pTokens;
        
        log.promptTokens = pTokens;
        log.completionTokens = cTokens;
        await log.save();
        updated++;
    }
    console.log('Updated:', updated);
    process.exit(0);
}).catch(console.error);
