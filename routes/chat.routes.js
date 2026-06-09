const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const verifyUser = require("../Utills/verifyUser"); 


router.use(verifyUser);



router.post("/message", chatController.sendMessage);




router.get("/history", chatController.getChatHistory);



router.get("/sessions", chatController.getUserSessions);


router.post("/sessions/new", chatController.startNewSession);

module.exports = router;
