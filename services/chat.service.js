const ChatSession = require("../models/Chat.model");
const { callOpenRouter } = require("./openrouter.service");


const CAREGIVER_SPECIALTIES = [
  "elderly care",
  "child care",
  "pet care",
  "medical care",
];


const getOrCreateSession = async (userId, sessionId = null) => {
  if (sessionId) {
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId,
    });
    if (session) return session;
  }

  let session = await ChatSession.findOne({
    userId,
    isActive: true,
  }).sort({ lastMessageAt: -1 });

  // Create a new session if none exists
  if (!session) {
    session = await ChatSession.create({
      userId,
      messages: [],
      sessionTitle: "محادثة جديدة",
    });
  }

  return session;
};


const validateSpecialty = (recommendedSpecialty) => {
  if (!recommendedSpecialty) return null;
  const normalized = recommendedSpecialty.toLowerCase().trim();
  return CAREGIVER_SPECIALTIES.includes(normalized) ? normalized : null;
};


const buildConversationHistory = (messages, limit = 10) => {
  const recent = messages.slice(-limit);
  return recent.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

// Main service: Send a user message and get AI response

const sendMessage = async (userId, userMessage, sessionId = null) => {
  // Get or create session
  const session = await getOrCreateSession(userId, sessionId);

  // Pass the fixed specialties list to AI
  const specialties = CAREGIVER_SPECIALTIES;

  // Build conversation history for AI context
  const conversationHistory = buildConversationHistory(session.messages);
  conversationHistory.push({ role: "user", content: userMessage });

  // Call OpenRouter AI
  const aiResponse = await callOpenRouter(conversationHistory, specialties);

  //  Validate recommended specialty against allowed list (safety: no fake specialties)
  aiResponse.recommendedSpecialty = validateSpecialty(
    aiResponse.recommendedSpecialty
  );

  // Save user message to session
  session.messages.push({
    role: "user",
    content: userMessage,
    intent: null,
    structuredResponse: {},
  });

  //  Save bot response to session
  session.messages.push({
    role: "assistant",
    content: aiResponse.botMessage,
    intent: aiResponse.intent,
    structuredResponse: {
      botMessage: aiResponse.botMessage,
      suggestedRequestDescription: aiResponse.suggestedRequestDescription,
      recommendedSpecialty: aiResponse.recommendedSpecialty,
      followUpQuestions: aiResponse.followUpQuestions,
      intent: aiResponse.intent,
    },
  });

  // 8. Update session title from first user message
  if (session.messages.length <= 2) {
    session.sessionTitle =
      userMessage.length > 40
        ? userMessage.substring(0, 40) + "..."
        : userMessage;
  }

  await session.save();

  return {
    sessionId: session._id,
    ...aiResponse,
  };
};

/**
 * Get full chat history for a user session
 */
const getChatHistory = async (userId, sessionId = null) => {
  let query = { userId, isActive: true };
  if (sessionId) query._id = sessionId;

  const session = await ChatSession.findOne(query).sort({ lastMessageAt: -1 });

  if (!session) {
    return {
      sessionId: null,
      messages: [],
      sessionTitle: null,
    };
  }

  return {
    sessionId: session._id,
    sessionTitle: session.sessionTitle,
    createdAt: session.createdAt,
    messages: session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      intent: msg.intent,
      structuredResponse:
        msg.role === "assistant" ? msg.structuredResponse : undefined,
      timestamp: msg.createdAt,
    })),
  };
};

/**
 * Get all chat sessions for a user
 */
const getUserSessions = async (userId) => {
  const sessions = await ChatSession.find({ userId, isActive: true })
    .select("sessionTitle lastMessageAt createdAt messages")
    .sort({ lastMessageAt: -1 });

  return sessions.map((s) => ({
    sessionId: s._id,
    sessionTitle: s.sessionTitle,
    messageCount: s.messages.length,
    lastMessageAt: s.lastMessageAt,
    createdAt: s.createdAt,
  }));
};

/**
 * Start a brand new chat session for a user
 */
const startNewSession = async (userId) => {
  const session = await ChatSession.create({
    userId,
    messages: [],
    sessionTitle: "محادثة جديدة",
  });

  return { sessionId: session._id };
};

module.exports = {
  sendMessage,
  getChatHistory,
  getUserSessions,
  startNewSession,
};
