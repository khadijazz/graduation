const express=require("express");
const router=express.Router();
const bookingController=require("../controllers/booking.controller");

router.route("/")
.post(bookingController.createBooking)
.get(bookingController.getAllBookings);

router.route("/:id")
.get(bookingController.getBookingById)
.patch(bookingController.updateBooking)
.delete(bookingController.deleteBooking);

module.exports=router;