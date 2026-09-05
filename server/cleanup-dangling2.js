import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const validUsers = await db.collection("users").find({}, { projection: { _id: 1 } }).toArray();
  const validUserIds = validUsers.map(u => u._id.toString());

  const forumUsers = await db.collection("forumusers").find({}).toArray();
  let deletedForumUsers = 0;
  for (const fu of forumUsers) {
    if (fu.userId && !validUserIds.includes(fu.userId.toString())) {
      await db.collection("forumusers").deleteOne({ _id: fu._id });
      deletedForumUsers++;
    }
  }

  const forumOtps = await db.collection("forumotps").find({}).toArray();
  let deletedForumOtps = 0;
  for (const fo of forumOtps) {
    if (fo.userId && !validUserIds.includes(fo.userId.toString())) {
      await db.collection("forumotps").deleteOne({ _id: fo._id });
      deletedForumOtps++;
    }
  }

  console.log(`Cleaned up ${deletedForumUsers} dangling forum users.`);
  console.log(`Cleaned up ${deletedForumOtps} dangling forum OTPs.`);
  process.exit();
}
run();
