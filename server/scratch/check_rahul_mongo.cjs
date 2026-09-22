const { MongoClient } = require('mongodb');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("No MONGO_URI found in .env");
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('classgrid');
        const collection = db.collection('platform_rag_chunks');

        const docs = await collection.find({ chunkText: { $regex: 'Rahul Saxena', $options: 'i' } }).toArray();
        console.log("Documents found in platform_rag_chunks:");
        console.log(JSON.stringify(docs, null, 2));

        const collection2 = db.collection('rag_chunks');
        const docs2 = await collection2.find({ chunkText: { $regex: 'Rahul Saxena', $options: 'i' } }).toArray();
        console.log("\nDocuments found in rag_chunks:");
        console.log(JSON.stringify(docs2, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

run();
