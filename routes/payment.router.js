const express = require("express");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const paymentController = require("../controllers/payment.controller");
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser)
router.post("/create", permittedTo(["caregiver"]), paymentController.createPayment);

router.post("/callback", paymentController.paymobCallback);

module.exports = router;