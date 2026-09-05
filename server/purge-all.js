import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const email = "konalhousehold@gmail.com";
  
  const cols = await db.listCollections().toArray();
  for (const col of cols) {
    const filter = {
      $or: [
        { email: new RegExp('^' + email + '$', 'i') },
        { workEmail: new RegExp('^' + email + '$', 'i') },
        { "contact.email": new RegExp('^' + email + '$', 'i') },
        { invoice_email: new RegExp('^' + email + '$', 'i') },
        { adminEmail: new RegExp('^' + email + '$', 'i') }
      ]
    };
    
    try {
      const result = await db.collection(col.name).deleteMany(filter);
      if (result.deletedCount > 0) {
        console.log('Deleted ' + result.deletedCount + ' docs from ' + col.name);
      }
    } catch(e) {}
  }
  console.log("Done");
  process.exit();
}
run();
