const express = require("express");
const notificationController = require("../controllers/notification.controller");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");

router.use(verifyUser);

router.route("/")
  .get(notificationController.getMyNotifications);

router.route("/mark-all-read")
  .patch(notificationController.markAllRead);

router.route("/:id/read")
  .patch(notificationController.markRead);

module.exports = router;
