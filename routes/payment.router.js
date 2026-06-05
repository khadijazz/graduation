const express = require("express");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const paymentController = require("../controllers/payment.controller");
<<<<<<< HEAD
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser)
router.post("/create", permittedTo(["caregiver"]), paymentController.createPayment);

router.post("/callback", paymentController.paymobCallback);
=======
const { permittedTo } = require("../Utills/premittedTo");

router.post("/callback", paymentController.paymobCallback);
router.get("/callback", paymentController.paymobCallback);

router.use(verifyUser);

router.post("/create", permittedTo(["client"]), paymentController.createPayment);
router.post("/pay-booking-wallet", permittedTo(["client"]), paymentController.payBookingFromWallet);
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1

module.exports = router;