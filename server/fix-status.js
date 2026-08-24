import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const res = await User.updateMany(
        { status: 'pending', lastLoginAt: { $ne: null } },
        { $set: { status: 'active' } }
    );
    console.log("Updated users:", res);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
