const express = require("express");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const paymentController = require("../controllers/payment.controller");
const { permittedTo } = require("../Utills/premittedTo");

router.post("/callback", paymentController.paymobCallback);
router.get("/callback", paymentController.paymobCallback);
router.get("/redirect", paymentController.paymobRedirect);

router.use(verifyUser);

router.post("/create", permittedTo(["client"]), paymentController.createPayment);
router.post("/pay-booking-wallet", permittedTo(["client"]), paymentController.payBookingFromWallet);

module.exports = router;