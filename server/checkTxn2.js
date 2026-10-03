// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const PlatformTransaction = (await import("./src/models/PlatformTransaction.js")).default;
  const tx = await PlatformTransaction.findOne({ razorpayPaymentId: "pay_Thx6B7Ww7shl7w" }).lean();
  console.log("Transaction details:", JSON.stringify(tx, null, 2));
  
  const orgId = tx?.organizationId;
  if (orgId) {
    const Organization = (await import("./src/models/Organization.js")).default;
    const org = await Organization.findById(orgId).lean();
    console.log("Org details:", JSON.stringify({ name: org?.name, email: org?.email, phone: org?.phone }, null, 2));
    
    const User = (await import("./src/models/User.js")).default;
    const owner = await User.findOne({ organization_id: orgId, role: "owner" }).lean();
    console.log("Org Owner details:", JSON.stringify({ name: owner?.name, email: owner?.email, phone: owner?.phoneNumber }, null, 2));
  }
  process.exit(0);
}

run().catch(console.error);
