const express = require("express");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const paymentController = require("../controllers/payment.controller");

router.post("/create", verifyUser, paymentController.createPayment);

router.post("/callback", paymentController.paymobCallback);

module.exports = router;