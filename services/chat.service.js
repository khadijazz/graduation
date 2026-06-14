const { ChatSession, Message } = require("../models/Chat.model");
const { callOpenRouter } = require("./openrouter.service");
const { ApiError } = require("../Utills/ApiError");

// Max conversation turns to send to OpenRouter (keeps token usage bounded)
const HISTORY_LIMIT = 20;

// ─── Create Session ───────────────────────────────────────────────────────────

/**
 * Create a new empty chat session for the user.
 * @param {string} userId
 * @returns {Promise<{ sessionId: string, title: string, createdAt: Date }>}
 */
async function createSession(userId) {
  const session = await ChatSession.create({
    user: userId,
    title: "New Conversation",
  });

  return {
    sessionId: session._id,
    title: session.title,
    createdAt: session.createdAt,
  };
}

// ─── Send Message ─────────────────────────────────────────────────────────────

/**
 * Send a user message in a session, call OpenRouter with history, persist both
 * messages, and return the assistant reply.
 * @param {string} userId
 * @param {string} sessionId
 * @param {string} userMessage
 * @returns {Promise<{ sessionId: string, message: object }>}
 */
async function sendMessage(userId, sessionId, userMessage) {
  // Verify the session belongs to this user
  const session = await ChatSession.findOne({ _id: sessionId, user: userId });
  if (!session) {
    throw new ApiError("Session not found or access denied.", 404);
  }

  // Load recent conversation history (oldest first, newest last)
  const historyDocs = await Message.find({ session: sessionId })
    .sort({ createdAt: 1 })
    .limit(HISTORY_LIMIT)
    .lean();

  const conversationHistory = historyDocs.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Call OpenRouter — history + new user message
  const assistantReply = await callOpenRouter(conversationHistory, userMessage);

  // Persist user message
  await Message.create({
    session: sessionId,
    role: "user",
    content: userMessage,
  });

  // Persist assistant reply
  const assistantMessage = await Message.create({
    session: sessionId,
    role: "assistant",
    content: assistantReply,
  });

  // Auto-title the session from the first user message
  if (historyDocs.length === 0) {
    session.title =
      userMessage.length > 60
        ? userMessage.substring(0, 60).trim() + "…"
        : userMessage.trim();
    await session.save();
  }

  return {
    sessionId: session._id,
    message: {
      _id: assistantMessage._id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
    },
  };
}

// ─── Get Session Messages ─────────────────────────────────────────────────────

/**
 * Retrieve all messages for a session (verifies ownership).
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<{ sessionId: string, title: string, messages: Array }>}
 */
async function getSessionMessages(userId, sessionId) {
  const session = await ChatSession.findOne({ _id: sessionId, user: userId });
  if (!session) {
    throw new ApiError("Session not found or access denied.", 404);
  }

  const messages = await Message.find({ session: sessionId })
    .sort({ createdAt: 1 })
    .lean();

  return {
    sessionId: session._id,
    title: session.title,
    createdAt: session.createdAt,
    messages: messages.map((m) => ({
      _id: m._id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}

// ─── Get User Sessions ────────────────────────────────────────────────────────

/**
 * List all chat sessions belonging to the user, with message counts and
 * the last message preview.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getUserSessions(userId) {
  const sessions = await ChatSession.find({ user: userId })
    .sort({ updatedAt: -1 })
    .lean();

  if (sessions.length === 0) return [];

  // Batch-fetch message counts and last messages for all sessions
  const sessionIds = sessions.map((s) => s._id);

  const [counts, lastMessages] = await Promise.all([
    // Count messages per session
    Message.aggregate([
      { $match: { session: { $in: sessionIds } } },
      { $group: { _id: "$session", count: { $sum: 1 } } },
    ]),
    // Get the latest message per session
    Message.aggregate([
      { $match: { session: { $in: sessionIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$session",
          lastContent: { $first: "$content" },
          lastRole: { $first: "$role" },
          lastAt: { $first: "$createdAt" },
        },
      },
    ]),
  ]);

  // Build lookup maps
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const lastMap = Object.fromEntries(
    lastMessages.map((l) => [
      l._id.toString(),
      { content: l.lastContent, role: l.lastRole, at: l.lastAt },
    ])
  );

  return sessions.map((s) => {
    const id = s._id.toString();
    const last = lastMap[id];
    return {
      sessionId: s._id,
      title: s.title,
      messageCount: countMap[id] || 0,
      lastMessage: last
        ? {
            role: last.role,
            preview:
              last.content.length > 80
                ? last.content.substring(0, 80) + "…"
                : last.content,
            at: last.at,
          }
        : null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });
}

module.exports = {
  createSession,
  sendMessage,
  getSessionMessages,
  getUserSessions,
};
