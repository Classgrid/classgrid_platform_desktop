// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const AiUsageLog = require('./src/models/AiUsageLog.js').default || require('./src/models/AiUsageLog.js');
    const logMatch = { createdAt: { $gte: new Date(2026, 8, 1), $lt: new Date(2026, 9, 1) } };
    const modelData = await AiUsageLog.aggregate([{ $match: logMatch }, { $group: { _id: '$model', requests: { $sum: 1 }, tokens: { $sum: '$totalTokens' } } }]);
    console.log(JSON.stringify(modelData, null, 2));
    process.exit(0);
});
