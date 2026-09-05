/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const messageDraftSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      unique: true, // One draft per ticket
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional, so AI can create a draft without knowing which admin clicked
    },
    draftContent: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["manual", "ai_generated"],
      default: "manual",
    },
    aiContext: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const MessageDraft = mongoose.models.MessageDraft || mongoose.model("MessageDraft", messageDraftSchema);

export default MessageDraft;
