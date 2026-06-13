const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const locationController = require("../controllers/location.controller");
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");

router.use(verifyUser);

router.route("/")
    .get(permittedTo(["client", "caregiver"]), bookingController.getAllBookings);


router.route("/confirmbookingandpay/:id")
    .patch(permittedTo(["client"]), bookingController.confirmBookingAndPay);

router.route("/process-payment")
    .post(permittedTo(["client"]), bookingController.processPaymentAndConfirmBooking);

router.route("/process-payment/:offerId")
    .post(permittedTo(["client"]), bookingController.processPaymentAndConfirmBooking);


router.route("/:bookingId/tasks")
    .get(permittedTo(["client", "caregiver"]), bookingController.getBookingTasks);

router.route("/:bookingId/location")
    .post(permittedTo(["caregiver"]), locationController.updateLocation)
    .get(permittedTo(["client", "caregiver"]), locationController.getLocation);

router.route("/:id")
    .get(permittedTo(["client", "caregiver"]), bookingController.getBookingById)
    .patch(permittedTo(["client"]), bookingController.updateBooking)
    .delete(permittedTo(["client"]), bookingController.deleteBooking);

module.exports = router;