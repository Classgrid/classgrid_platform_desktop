/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function clearDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    // Clear EmailConversations (AI Memory)
    console.log("Clearing EmailConversations (AI Memory)...");
    const emailResult = await mongoose.connection.collection('emailconversations').deleteMany({});
    console.log(`Deleted ${emailResult.deletedCount} EmailConversations.`);

    // Clear SupportTickets (Tickets and Enquiries)
    console.log("Clearing SupportTickets...");
    const ticketResult = await mongoose.connection.collection('supporttickets').deleteMany({});
    console.log(`Deleted ${ticketResult.deletedCount} SupportTickets.`);

    // Clear SupportConversations (Ticket Replies)
    console.log("Clearing SupportConversations...");
    const convoResult = await mongoose.connection.collection('supportconversations').deleteMany({});
    console.log(`Deleted ${convoResult.deletedCount} SupportConversations.`);

    console.log("SUCCESS! All tickets, enquiries, and AI memory have been cleared.");
  } catch (error) {
    console.error("Error clearing DB:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

clearDB();
