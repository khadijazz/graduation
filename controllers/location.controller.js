const Booking = require("../models/booking.model");
const CaregiverLocation = require("../models/caregiverLocation.model");
const { ApiError } = require("../Utills/ApiError");

exports.updateLocation = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { latitude, longitude } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Security check: Only the assigned caregiver can send location updates.
    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: Only the assigned caregiver can update location", 403);
    }

    // Completed/inactive bookings cannot receive location updates
    if (booking.bookingStatus !== "IN_PROGRESS" || !booking.isTrackingActive) {
      throw new ApiError("Location updates are only allowed for active bookings with live tracking enabled", 400);
    }

    // Validate coordinates
    if (latitude === undefined || longitude === undefined || typeof latitude !== "number" || typeof longitude !== "number") {
      throw new ApiError("Invalid coordinates: Latitude and longitude are required and must be numbers", 400);
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new ApiError("Invalid coordinates: Latitude must be between -90 and 90, longitude between -180 and 180", 400);
    }

    const updatedLocation = await CaregiverLocation.findOneAndUpdate(
      { booking: bookingId },
      {
        caregiver: booking.caregiver,
        latitude,
        longitude,
        lastUpdated: new Date()
      },
      { returnDocument: "after", upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        bookingId: updatedLocation.booking,
        caregiverId: updatedLocation.caregiver,
        latitude: updatedLocation.latitude,
        longitude: updatedLocation.longitude,
        lastUpdated: updatedLocation.lastUpdated
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLocation = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Security check: Only the client associated with the booking, the assigned caregiver, or an admin can access location data.
    const isClient = booking.client.toString() === req.user._id.toString();
    const isCaregiver = booking.caregiver.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isClient && !isCaregiver && !isAdmin) {
      throw new ApiError("Unauthorized: Access denied to this booking's location data", 403);
    }

    // Edge cases: Client attempts to view location before check-in or after check-out.
    // Before Check-In (status is not IN_PROGRESS and checkInTime is not set)
    if (booking.bookingStatus !== "IN_PROGRESS" && !booking.checkInTime) {
      throw new ApiError("Cannot view location before check-in", 400);
    }

    // After Check-Out (status is COMPLETED or checkOutTime is set)
    if (booking.bookingStatus === "COMPLETED" || booking.checkOutTime) {
      throw new ApiError("Cannot view location after check-out", 400);
    }

    const location = await CaregiverLocation.findOne({ booking: bookingId });
    if (!location) {
      throw new ApiError("No location updates received yet for this booking", 404);
    }

    res.status(200).json({
      success: true,
      message: "Caregiver location retrieved successfully",
      data: {
        bookingId: location.booking,
        caregiverId: location.caregiver,
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: location.lastUpdated
      }
    });
  } catch (error) {
    next(error);
  }
};
