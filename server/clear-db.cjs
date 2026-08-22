const mongoose = require("mongoose");
require("dotenv").config();

async function clearCollections() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // The main collections that hold AI chats, support tickets, inquiries, and attachments
    const collectionsToClear = [
      "supporttickets",
      "supportinquiries",
      "chat_sessions",
      "chat_messages",
      "chat_attachments",
      "support_tickets",
      "support_inquiries",
      "inquiries",
      "tickets"
    ];

    for (const name of collectionsToClear) {
      try {
        await db.collection(name).deleteMany({});
        console.log(`✅ Cleared collection: ${name}`);
      } catch (e) {
        // Ignore if collection doesn't exist
      }
    }

    console.log("All requested collections cleared!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

clearCollections();
