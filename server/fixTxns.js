// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const PlatformTransaction = (await import("./src/models/PlatformTransaction.js")).default;
  const User = (await import("./src/models/User.js")).default;
  const Organization = (await import("./src/models/Organization.js")).default;

  const txns = await PlatformTransaction.find({ 
    $or: [
      { userName: "" },
      { userName: "Unknown" },
      { userName: null }
    ]
  });

  console.log(`Found ${txns.length} transactions to fix.`);

  let updatedCount = 0;
  for (const tx of txns) {
    let resolvedUser = null;
    let resolvedOrgName = tx.organizationName;

    // 1. Try to find by userId
    if (tx.userId) {
      resolvedUser = await User.findById(tx.userId);
    }

    // 2. Fallback to organization owner
    if (!resolvedUser && tx.organizationId) {
      resolvedUser = await User.findOne({ organization_id: tx.organizationId, role: "owner" });
    }

    // 3. Resolve Organization Name if missing
    if (tx.organizationId && (!resolvedOrgName || resolvedOrgName === "")) {
       const org = await Organization.findById(tx.organizationId);
       if (org) resolvedOrgName = org.name;
    }

    if (resolvedUser) {
      tx.userName = resolvedUser.name || "Unknown";
      tx.userEmail = tx.userEmail || resolvedUser.email || "";
      tx.userMobile = tx.userMobile || resolvedUser.phoneNumber || "";
      if (!tx.userId) tx.userId = resolvedUser._id;
      tx.userRole = tx.userRole || resolvedUser.role || "";
    } else {
      tx.userName = "Unknown Customer";
    }

    tx.organizationName = resolvedOrgName || tx.organizationName;

    await tx.save();
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} transactions.`);
  process.exit(0);
}

run().catch(console.error);
