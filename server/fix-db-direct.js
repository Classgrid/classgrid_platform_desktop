import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

mongoose.connect(MONGODB_URI).then(async () => {
  const Organization = (await import('./src/models/Organization.js')).default;
  const result = await Organization.updateMany(
    { org_mode: 'sandbox', status: 'active' },
    { $set: { status: 'sandbox' } }
  );
  console.log('Fixed organizations:', result.modifiedCount);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
