require('dotenv').config({ path: __dirname + '/../.env' });
const { MongoClient } = require('mongodb');

async function run() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('classgrid');
        const collection = db.collection('platform_rag_chunks');

        // Simple text search as fallback, or vector search
        const docs = await collection.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // Guessing the index name
                    path: "embedding",
                    queryVector: new Array(1024).fill(0.1),
                    numCandidates: 100,
                    limit: 5
                }
            }
        ]).toArray();
        console.log("Vector search successful!", docs.length);
    } catch (error) {
        console.error("Vector search failed:", error.message);
    } finally {
        await client.close();
    }
}

run();
