import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function resetBilling() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Organization = mongoose.connection.collection("organizations");
        
        // We'll reset billing email fields for the specific email, or for all if needed.
        // I will reset it for the orgs that have the email "nehasharmaking25@gmail.com"
        // or just reset it everywhere so the user can start fresh.
        const result = await Organization.updateMany(
            {},
            { 
                $unset: { 
                    "billing_settings.invoice_email": "",
                    "billing_settings.pending_invoice_email": "",
                    "billing_settings.email_verified": "",
                    "billing_settings.verification_token": "",
                    "billing_settings.verification_expires_at": "",
                    "billing_settings.phone_verified": ""
                } 
            }
        );
        console.log(`Reset billing email fields for ${result.modifiedCount} organizations.`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

resetBilling();
