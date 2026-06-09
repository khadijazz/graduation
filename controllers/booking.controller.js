const { ApiError } = require("../Utills/ApiError.js");
const bookingService = require("../services/booking.services");



exports.getAllBookings = async (req, res, next) => {
  const Booking = await bookingService.getallbooking(req.query);
  res.status(200).json({
    message: "bookings fetched successfully",
    success: true,
    data: Booking
  })
};

exports.getBookingById = async (req, res, next) => {
  const Booking = await bookingService.getbookingbyid(req.params.id);
  if (!Booking) {
    throw new ApiError("booking with this id does not exist", 404);
  }
  res.status(200).json({
    message: "booking retrieved successfully",
    success: true,
    data: Booking
  })
}

exports.updateBooking = async (req, res, next) => {
  const id = req.params.id;
  const Data = req.body;
  const Booking = await bookingService.updatebooking(id, Data);
  res.status(200).json({
    message: "booking updated successfully",
    success: true,
    data: Booking
  })
}

exports.deleteBooking = async (req, res, next) => {
  const id = req.params.id;
  const Booking = await bookingService.deletebooking(id);
  res.status(200).json({
    message: "booking deleted successfully",
  })
}

exports.confirmBookingAndPay = async (req, res, next) => {
  const Booking = await bookingService.confirmBookingAndPay(req.params.id, req.user.id);
  res.status(200).json({
    message: "booking confirmed successfully",
    success: true,
    data: Booking
  })
};

exports.processPaymentAndConfirmBooking = async (req, res, next) => {
  try {
    const offerId = req.params.offerId || req.body.offerId;
    if (!offerId) {
      throw new ApiError("Offer ID is required", 400);
    }
    const booking = await bookingService.processPaymentAndConfirmBooking(offerId, req.user._id);
    res.status(200).json({
      message: "Payment processed and booking accepted successfully",
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};