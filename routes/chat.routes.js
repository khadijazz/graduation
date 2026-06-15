const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const verifyUser = require("../Utills/verifyUser");


router.use(verifyUser);


router.post("/", chatController.createSession);
router.get("/", chatController.getUserSessions);

router.post("/:sessionId/messages", chatController.sendMessage);
router.get("/:sessionId/messages", chatController.getSessionMessages);

module.exports = router;
