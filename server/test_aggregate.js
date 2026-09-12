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
    console.log("Aggregate result count:", result.length);
    console.log("Result sample:", JSON.stringify(result.slice(0, 3), null, 2));
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.dir);
