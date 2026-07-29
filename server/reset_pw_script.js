import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = (await import('./src/models/User.js')).default;
        
        const email = "nehasharmaking25@gmail.com";
        const newPassword = "Nikhil@5049";
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        await user.save();
        
        console.log("Password reset successfully for " + email);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
