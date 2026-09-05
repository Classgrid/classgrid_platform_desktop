import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Delete users with no organization and not super_admin
  const userFilter = {
    $or: [
      { organization_id: null },
      { organization_id: { $exists: false } }
    ],
    role: { $nin: ["super_admin", "co_super_admin"] }
  };
  const userResult = await db.collection("users").deleteMany(userFilter);
  console.log("Deleted " + userResult.deletedCount + " users with no organization and no super admin role.");

  // 2. Delete all demo requests to clear the way
  const demoResult = await db.collection("demorequests").deleteMany({});
  console.log("Deleted " + demoResult.deletedCount + " demo requests.");

  console.log("Cleanup complete!");
  process.exit();
}
run();
