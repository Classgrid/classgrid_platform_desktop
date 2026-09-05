import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("No MONGODB_URI found");
  process.exit(1);
}

mongoose.connect(MONGODB_URI).then(async () => {
  const Organization = (await import('./src/models/Organization.js')).default;
  const result = await Organization.updateMany(
    { org_mode: 'sandbox', status: 'active' },
    { $set: { status: 'sandbox' } }
  );
  console.log('Fixed organizations:', result.modifiedCount);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
