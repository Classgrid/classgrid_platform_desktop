import mongoose from 'mongoose';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const users = await db.collection('users').find({ "role": "org_admin" }).project({ name: 1, email: 1, role: 1, organization: 1 }).toArray();
    console.log("Total org_admins:", users.length);
    console.log(users);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
