/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */
﻿const mongoose = require('mongoose');
require('dotenv').config();
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const org = await mongoose.connection.db.collection('organizations').findOne({ logo_url: { $regex: '^data:image' } });
  if (org) {
    console.log('Found org with base64 logo. Length:', org.logo_url.length);
  } else {
    console.log('No org with base64 logo found');
  }
  process.exit();
}
run();
