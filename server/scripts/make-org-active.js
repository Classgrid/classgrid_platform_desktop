import mongoose from "mongoose";
import dotenv from "dotenv";
import OrgSubscription from "../src/models/OrgSubscription.js";

dotenv.config({ path: "../.env" });

async function makeOrgActive() {
  const orgId = "6a2d452b1c952d43497101c8";
  
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const subscription = await OrgSubscription.findOneAndUpdate(
      { organization_id: orgId },
      {
        $set: {
          plan: "active",
          status: "active",
          isPaid: true,
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
          razorpay_subscription_id: "sub_mock_" + Date.now(),
          razorpay_customer_id: "cust_mock_" + Date.now(),
          "metadata.max_students": 5000,
          "metadata.max_faculty": 200,
          "metadata.max_dept_admins": 20,
          "metadata.storage_limit_gb": 500,
          "billing.basePricePerMonth": 2000,
          "billing.pricePerStudent": 150,
          "billing.pricePerFaculty": 500,
          "billing.pricePerGB": 20,
          "billing.pricePerEmail": 0.5,
          "billing.pricePerSms": 2.5
        }
      },
      { new: true, upsert: true }
    );

    console.log("✅ Successfully converted org from DEMO to ACTIVE Pay-As-You-Go!");
    console.log("New Subscription Details:", JSON.stringify(subscription, null, 2));
    
  } catch (error) {
    console.error("Error updating subscription:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeOrgActive();
