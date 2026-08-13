const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient('mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid');
  try {
    await client.connect();
    const db = client.db('classgrid');
    const collections = await db.listCollections().toArray();
    console.log('Total Collections in Atlas:', collections.length);
    console.log('Collection Names:', collections.map(c => c.name).slice(0, 15).join(', ') + '...');
  } catch (e) { console.error(e); } finally { await client.close(); }
}
run();
