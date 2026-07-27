const mongoose = require('mongoose');

async function cleanUpDummyLead() {
    try {
        await mongoose.connect('mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid');
        
        const DemoRequest = (await import('./src/models/DemoRequest.js')).default;
        
        // Find and delete the dummy lead I just created
        const result = await DemoRequest.deleteOne({ adminEmail: "test@example.com", institutionName: "Dummy Test Institute" });
        
        console.log("Deleted dummy lead:", result.deletedCount);
    } catch (e) {
        console.error("Error cleaning up:", e);
    } finally {
        process.exit(0);
    }
}

cleanUpDummyLead();
