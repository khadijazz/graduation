const { ApiError } = require("../Utills/ApiError.js");
const bookingService = require("../services/booking.services");
const Request = require("../models/request.model");
const Task = require("../models/tasks.model");



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

exports.getBookingTasks = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.getbookingbyid(bookingId);

    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Access control:
    // Only assigned caregivers can retrieve tasks for their Booking.
    // Clients can only view tasks related to their own bookings.
    if (req.user.role === "caregiver") {
      if (!booking.caregiver || booking.caregiver.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized: You are not the caregiver for this booking", 403);
      }
    } else if (req.user.role === "client") {
      if (!booking.client || booking.client.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized: You are not the client for this booking", 403);
      }
    } else if (req.user.role !== "admin") {
      throw new ApiError("Unauthorized access", 403);
    }

    // Retrieve the associated request
    const request = await Request.findById(booking.request);
    if (!request) {
      throw new ApiError("Request associated with this booking not found", 404);
    }

    // Retrieve the tasks linked to that request
    const tasks = await Task.find({ request: request._id });

    // Format tasks to match exact key requirements
    const formattedTasks = tasks.map(task => ({
      taskId: task._id,
      taskName: task.taskDescription,
      taskStatus: task.taskState,
      requestId: task.request,
      bookingId: booking._id,
      checkInTime: task.checkInTime || null,
      checkOutTime: task.checkOutTime || null,
      proofFiles: task.proofFiles || [],
      // Keep old model values for backward compatibility
      _id: task._id,
      taskDescription: task.taskDescription,
      taskState: task.taskState,
      proofType: task.proofType,
      proofUrl: task.proofUrl,
      taskType: task.taskType
    }));

    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: formattedTasks
    });
  } catch (error) {
    next(error);
  }
};