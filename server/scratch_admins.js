import mongoose from 'mongoose';

const uri = 'mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin';

async function run() {
    try {
        await mongoose.connect(uri);
        
        // Use a generic schema so we can access any collection
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        
        const users = await User.find({ role: 'org_admin' }).lean();
        
        console.log('=== REAL REASON FROM BACKEND ===');
        console.log(`Total Org Admins: ${users.length}`);
        if(users.length > 0) {
            console.log(`Fields per admin: ${Object.keys(users[0]).length} fields! (This massive size was crashing the AI)`);
        }
        
        console.log('\n=== REAL LIST OF EVERY ADMIN ===');
        users.forEach(u => {
            console.log(`Name: ${u.name || '[No Name]'} | Email: ${u.email}`);
        });
        
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
