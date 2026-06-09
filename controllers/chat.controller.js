const chatService = require("../services/chat.service");
const { ApiError } = require("../Utills/ApiError");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const ApiResponse = (statusCode, data, message) => ({
  success: statusCode < 400,
  statusCode,
  message,
  data,
});


const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user._id;

  if (!message || message.trim() === "") {
    throw new ApiError("الرسالة لا يمكن أن تكون فارغة", 400);
  }

  if (message.trim().length > 1000) {
    throw new ApiError("الرسالة طويلة جداً، الحد الأقصى 1000 حرف", 400);
  }

  const result = await chatService.sendMessage(
    userId,
    message.trim(),
    sessionId || null
  );

  return res.status(200).json(
    ApiResponse(200, result, "تم استلام ردّ المساعد بنجاح")
  );
});


const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user._id;

  const history = await chatService.getChatHistory(userId, sessionId || null);

  return res.status(200).json(
    ApiResponse(200, history, "تم جلب المحادثة بنجاح")
  );
});


const getUserSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sessions = await chatService.getUserSessions(userId);

  return res.status(200).json(
    ApiResponse(200, { sessions }, "تم جلب المحادثات السابقة بنجاح")
  );
});


const startNewSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await chatService.startNewSession(userId);

  return res.status(201).json(
    ApiResponse(201, result, "تم إنشاء محادثة جديدة")
  );
});

module.exports = {
  sendMessage,
  getChatHistory,
  getUserSessions,
  startNewSession,
};