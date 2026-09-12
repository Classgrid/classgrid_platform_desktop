import mongoose from 'mongoose';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    const collection = mongoose.connection.db.collection('users');
    const result = await collection.aggregate([
      { $match: { role: 'org_admin' } },
      { $limit: 2 },
      {
        $lookup: {
          from: 'organizations',
          let: { orgId: "$organization_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$orgId" }] } } }
          ],
          as: 'organization_details'
        }
      }
    ]).toArray();
    
    console.log("With $toObjectId lookup:", JSON.stringify(result.map(r => ({ name: r.name, org_details: r.organization_details })), null, 2));
    
  } catch (e) {
      console.log("Error:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}
run();
