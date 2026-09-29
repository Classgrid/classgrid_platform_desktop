const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid';

async function main() {
    try {
        console.log("Connecting using direct shard URI...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB!");
        
        const db = mongoose.connection.db;
        
        const userRes = await db.collection('users').updateOne(
            { email: "nikhil.shinde@classgrid.in" },
            { 
                $set: { 
                    "ai_tokens.free_weekly_limit": 500000000, 
                    "ai_tokens.used_this_week": 0 
                } 
            }
        );
        console.log("Credits reset! Result:", userRes);
        
    } catch(err) {
        console.error("Failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

main();
