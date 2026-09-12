import mongoose from 'mongoose';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // Check if platform_rag_chunks has the users
    const chunks = await db.collection('platform_rag_chunks').find({ content: { $regex: 'admin@cds.classgrid.in', $options: 'i' } }).toArray();
    console.log("RAG chunks containing admin@cds.classgrid.in:", chunks.length);
    if(chunks.length > 0) {
        console.log("Sample chunk:", chunks[0].content);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
