import mongoose from 'mongoose';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    const collection = mongoose.connection.db.collection('users');
    const result = await collection.aggregate([
      { $match: { role: 'org_admin' } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'organization_details'
        }
      }
    ]).toArray();
    
    let outputText = JSON.stringify(result, null, 2);
    console.log("Total returned to AI:", result.length);
    console.log("Is it truncating? Length of output string:", outputText.length);
    // Let's print the first 2 users to see if they are different from the rest
    console.log("First 2:", JSON.stringify(result.slice(0,2), null, 2));
    
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.dir);
