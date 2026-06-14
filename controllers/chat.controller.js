const chatService = require("../services/chat.service");
const { ApiError } = require("../Utills/ApiError");

// ─── Async Handler Wrapper ────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── Rate Limiter (in-memory, per user) ──────────────────────────────────────
// Max 30 messages per user per 60-second window (generous for conversation flow)
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  if (!record || now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, rec] of rateLimitMap.entries()) {
    if (now - rec.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /chat
 * Create a new chat session.
 */
const createSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await chatService.createSession(userId);

  return res.status(201).json({
    success: true,
    message: "Session created successfully.",
    data: result,
  });
});

/**
 * POST /chat/:sessionId/messages
 * Send a message in an existing session and receive an AI reply.
 */
const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { sessionId } = req.params;
  const { message } = req.body;

  // Rate limiting
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      message: "Too many messages. Please wait a moment before continuing.",
    });
  }

  // Input validation
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new ApiError("Message cannot be empty.", 400);
  }
  if (message.trim().length > 2000) {
    throw new ApiError("Message is too long. Maximum 2000 characters.", 400);
  }
  if (!sessionId) {
    throw new ApiError("Session ID is required.", 400);
  }

  const result = await chatService.sendMessage(userId, sessionId, message.trim());

  return res.status(200).json({
    success: true,
    message: "Message sent successfully.",
    data: result,
  });
});

/**
 * GET /chat/:sessionId/messages
 * Retrieve the full conversation history for a session.
 */
const getSessionMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError("Session ID is required.", 400);
  }

  const result = await chatService.getSessionMessages(userId, sessionId);

  return res.status(200).json({
    success: true,
    message: "Messages retrieved successfully.",
    data: result,
  });
});

/**
 * GET /chat
 * Retrieve all chat sessions belonging to the authenticated user.
 */
const getUserSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessions = await chatService.getUserSessions(userId);

  return res.status(200).json({
    success: true,
    message: "Sessions retrieved successfully.",
    data: { sessions },
  });
});

module.exports = {
  createSession,
  sendMessage,
  getSessionMessages,
  getUserSessions,
};