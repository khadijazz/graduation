const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const verifyUser = require("../Utills/verifyUser"); 

/**
 * All chat routes require authentication
 */
router.use(verifyUser);

// ─── Message ──────────────────────────────────────────────
// POST   /api/chat/message       → Send a message & get AI response
router.post("/message", chatController.sendMessage);

// ─── History ──────────────────────────────────────────────
// GET    /api/chat/history       → Get current/latest session history
// GET    /api/chat/history?sessionId=xxx → Get specific session history
router.get("/history", chatController.getChatHistory);

// ─── Sessions ─────────────────────────────────────────────
// GET    /api/chat/sessions      → Get all user sessions (list)
router.get("/sessions", chatController.getUserSessions);

// POST   /api/chat/sessions/new  → Start a fresh new session
router.post("/sessions/new", chatController.startNewSession);

module.exports = router;
