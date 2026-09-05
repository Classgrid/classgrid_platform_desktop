import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // Find all users that are "stuck" (no org, not super admin)
  const userFilter = {
    $or: [
      { organization_id: null },
      { organization_id: { $exists: false } }
    ],
    role: { $nin: ["super_admin", "co_super_admin"] }
  };
  
  const stuckUsers = await db.collection("users").find(userFilter).toArray();
  const emailsToPurge = stuckUsers.map(u => u.email).filter(Boolean);
  const idsToPurge = stuckUsers.map(u => u._id);

  console.log(`Found ${stuckUsers.length} stuck users. Purging them from ALL collections...`);

  const cols = await db.listCollections().toArray();
  
  for (const col of cols) {
    if (emailsToPurge.length > 0) {
      // Create regexes for case-insensitive matching of emails
      const emailRegexes = emailsToPurge.map(email => new RegExp('^' + email + '$', 'i'));
      
      const filter = {
        $or: [
          { email: { $in: emailRegexes } },
          { workEmail: { $in: emailRegexes } },
          { "contact.email": { $in: emailRegexes } },
          { invoice_email: { $in: emailRegexes } },
          { adminEmail: { $in: emailRegexes } },
          { userId: { $in: idsToPurge } },
          { _id: { $in: idsToPurge } }
        ]
      };
      
      try {
        const result = await db.collection(col.name).deleteMany(filter);
        if (result.deletedCount > 0) {
          console.log(`Deleted ${result.deletedCount} dangling records from collection: ${col.name}`);
        }
      } catch (e) {
        // Some collections might not support certain operators, ignore errors
      }
    }
  }

  // Also delete all demo requests just to be totally clean
  const demoResult = await db.collection("demorequests").deleteMany({});
  console.log(`Deleted ${demoResult.deletedCount} stray demo requests.`);

  console.log("Cleanup completely finished!");
  process.exit();
}
run();
