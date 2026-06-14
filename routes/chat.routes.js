const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const verifyUser = require("../Utills/verifyUser");

// All chat routes require authentication
router.use(verifyUser);

// ─── Session Routes ───────────────────────────────────────────────────────────

/**
 * POST   /chat          → Create a new chat session
 * GET    /chat          → List all sessions for the authenticated user
 */
router.post("/", chatController.createSession);
router.get("/", chatController.getUserSessions);

// ─── Message Routes ───────────────────────────────────────────────────────────

/**
 * POST   /chat/:sessionId/messages  → Send a message; receive AI reply
 * GET    /chat/:sessionId/messages  → Retrieve full conversation history
 */
router.post("/:sessionId/messages", chatController.sendMessage);
router.get("/:sessionId/messages", chatController.getSessionMessages);

module.exports = router;
