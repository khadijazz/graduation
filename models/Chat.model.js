const mongoose = require("mongoose");

// ─── ChatSession Model ────────────────────────────────────────────────────────
// Stores session metadata only. Messages live in the Message collection.

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userlog",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Conversation",
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true }
);

// ─── Message Model ────────────────────────────────────────────────────────────
// Each message belongs to a session. Kept in a separate collection so we can
// efficiently query the last N messages without loading the full session.

const messageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { ChatSession, Message };
