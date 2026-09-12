import mongoose from 'mongoose';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ "roles": "org_admin" }).project({ name: 1, email: 1, roles: 1 }).toArray();
    console.log("Users with roles: org_admin");
    console.log(users);
    
    // Also check "role" instead of "roles" just in case the schema is different
    const users2 = await db.collection('users').find({ "role": "org_admin" }).project({ name: 1, email: 1, role: 1 }).toArray();
    console.log("Users with role: org_admin");
    console.log(users2);
    
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
