// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/classgrid');
        const db = mongoose.connection.db;
        
        console.log('--- Checking Organizations ---');
        const orgs = await db.collection('organizations').find({ 
            $or: [
                { name: { $regex: /classgrid/i } },
                { allowed_domains: 'classgrid.in' }
            ]
        }).toArray();
        console.log('Orgs found:', orgs.length);
        orgs.forEach(o => console.log(`- Name: ${o.name}, ID: ${o._id}, Domains: ${o.allowed_domains}`));

        console.log('\n--- Checking ALL Users in Classgrid Org ---');
        const orgId = new mongoose.Types.ObjectId('6a2d452b1c952d43497101c8');
        const orgUsers = await db.collection('users').find({ organization_id: orgId }).toArray();
        console.log(`Total users in Classgrid Org: ${orgUsers.length}`);
        orgUsers.forEach(u => {
            console.log(`- Name: ${u.name || 'N/A'}, Email: ${u.email}, Role: ${u.role}`);
        });

        console.log('\n--- Searching globally for "Neha" ---');
        const nehaUsers = await db.collection('users').find({ 
            $or: [
                { name: { $regex: /neha/i } },
                { email: { $regex: /neha/i } }
            ]
        }).toArray();
        console.log(`Total "Neha" users found: ${nehaUsers.length}`);
        nehaUsers.forEach(u => {
            console.log(`- Name: ${u.name || 'N/A'}, Email: ${u.email}, Role: ${u.role}, Org ID: ${u.organization_id || 'NULL'}`);
        });        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
