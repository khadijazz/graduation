const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      enum: [
        "improve_care_request",
        "recommend_caregiver_specialty",
        "app_usage_support",
        "general_question",
        null,
      ],
      default: null,
    },
    structuredResponse: {
      botMessage: { type: String, default: null },
      suggestedRequestDescription: { type: String, default: null },
      recommendedSpecialty: { type: String, default: null },
      followUpQuestions: { type: [String], default: [] },
      intent: { type: String, default: null },
    },
  },
  { timestamps: true }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionTitle: {
      type: String,
      default: "محادثة جديدة",
    },
    messages: [MessageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ChatSessionSchema.pre("save", function () {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = new Date();
  }
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
