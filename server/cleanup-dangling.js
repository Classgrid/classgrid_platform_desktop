import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Get all valid user IDs
  const validUsers = await db.collection("users").find({}, { projection: { _id: 1 } }).toArray();
  const validUserIds = validUsers.map(u => u._id.toString());

  // 2. Find and delete forumusers that point to non-existent users
  const forumUsers = await db.collection("forumusers").find({}).toArray();
  let deletedForumUsers = 0;
  for (const fu of forumUsers) {
    if (fu.userId && !validUserIds.includes(fu.userId.toString())) {
      await db.collection("forumusers").deleteOne({ _id: fu._id });
      deletedForumUsers++;
    }
  }

  // 3. Find and delete other dangling references (e.g. forumotps)
  // Optionally clear any other collections that require a valid user.

  console.log("Cleaned up " + deletedForumUsers + " dangling forum users.");
  process.exit();
}
run();
