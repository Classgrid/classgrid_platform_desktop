import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const Organization = mongoose.connection.collection("organizations");
    
    const result = await Organization.updateMany(
      { "billing_settings.invoice_email": "nehasharmaking25@gmail.com" },
      { 
        $unset: { 
          "billing_settings.invoice_email": "",
          "billing_settings.phone": "",
          "billing_settings.gstin": "",
          "billing_settings.billing_contact_name": "",
          "billing_settings.email_verified": "",
          "billing_settings.phone_verified": ""
        } 
      }
    );

    console.log(`Cleared billing settings for ${result.modifiedCount} organizations.`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
