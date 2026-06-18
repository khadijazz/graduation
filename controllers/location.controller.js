const Booking = require("../models/booking.model");
const CaregiverLocation = require("../models/caregiverLocation.model");
const { ApiError } = require("../Utills/ApiError");

exports.getLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    console.log({
  bookingClient: booking.client?.toString(),
  bookingCaregiver: booking.caregiver?.toString(),
  loggedInUser: req.user._id?.toString(),
  role: req.user.role,
});
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Security check: Only the client associated with the booking, the assigned caregiver, or an admin can access location data.
    const isClient = booking.client.toString() === req.user._id.toString();
    const isCaregiver = booking.caregiver.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isClient && !isCaregiver && !isAdmin) {
      throw new ApiError("Access denied to this booking's location data", 403);
    }

    // Prevent access if tracking is not active
    if (!booking.isTrackingActive) {
      throw new ApiError("Tracking not active", 409);
    }

    const location = await CaregiverLocation.findOne({ booking: id });
    if (!location) {
      throw new ApiError("No location updates received yet for this booking", 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
