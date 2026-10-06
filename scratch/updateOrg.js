import connectDB from './server/config/db.js';
import Organization from './server/src/models/Organization.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

async function update() {
  try {
    await connectDB();
    const org = await Organization.findById('6ac4b95e0f8a97f45e98b0ff');
    if (!org) {
      console.log("Org not found");
      process.exit(1);
    }

    org.ownerName = "Classgrid";
    org.name = "Classgrid";
    org.ownerEmail = "Support@classgrid.in";
    org.address = "Sector 26, Pradhikaran, Nigdi, near Akurdi Railway Station, Pimpri-Chinchwad, Pune, Maharashtra 411044, India";
    org.logo_url = "https://cdn.classgrid.in/classgrid/android-chrome-512x512.png";
    org.sidebar_logo_url = "https://cdn.classgrid.in/classgrid/android-chrome-512x512.png";

    await org.save();
    console.log("Org updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
