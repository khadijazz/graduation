const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");

router.post("/", verifyUser, permittedTo(["client"]), reviewController.createReview);

module.exports = router;
