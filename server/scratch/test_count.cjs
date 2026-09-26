require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  const count = await db.collection('platform_rag_chunks').countDocuments();
  console.log('Total platform_rag_chunks docs:', count);
  
  const sample = await db.collection('platform_rag_chunks').findOne({});
  console.log('Sample doc:', sample ? 'Yes' : 'No');
  if (sample) {
    console.log('Has embedding?', !!sample.embedding);
    console.log('Embedding length:', sample.embedding ? sample.embedding.length : 'N/A');
  }
  
  process.exit(0);
}

run().catch(console.error);
