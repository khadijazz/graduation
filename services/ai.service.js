/**
 * DEPRECATED — This file has been removed as part of the conversational
 * session architecture enhancement.
 *
 * The intent-based AI endpoint (POST /chat/ai) has been replaced by the
 * session-based chat system:
 *
 *   POST   /chat                    → Create session
 *   GET    /chat                    → List sessions
 *   POST   /chat/:sessionId/messages → Send message (AI responds automatically)
 *   GET    /chat/:sessionId/messages → Get conversation history
 *
 * All AI logic is now handled by:
 *   - services/openrouter.service.js  (OpenRouter API + unified system prompt)
 *   - services/chat.service.js        (session & message management)
 *   - controllers/chat.controller.js  (request handling)
 */

// This module intentionally exports nothing.
module.exports = {};
