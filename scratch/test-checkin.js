const axios = require("axios");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Booking = require("../models/booking.model");
const Task = require("../models/tasks.model");
require("dotenv").config();

const API_URL = "http://localhost:4000/booking";
const JWT_SECRET = "this-is-my-very-long-secret-key";

const bookingId = "6a33df780b828ce374e63c6e";
const caregiverId = "6a2d671c0f63b26fadc10ef0";
const caregiverToken = "Bearer " + jwt.sign({ id: caregiverId }, JWT_SECRET);

async function runCheckInTests() {
  console.log("Starting Booking Check-In PATCH Endpoint tests...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/graduation");
  console.log("Connected to DB");

  // Save original status
  const originalBooking = await Booking.findById(bookingId);
  console.log(`Original status: ${originalBooking.bookingStatus}, isTrackingActive: ${originalBooking.isTrackingActive}`);

  // Temporarily reset to CONFIRMED and isTrackingActive: false
  originalBooking.bookingStatus = "CONFIRMED";
  originalBooking.isTrackingActive = false;
  // Clear checkInTime to avoid interference
  originalBooking.checkInTime = undefined;
  await originalBooking.save();
  console.log("Temporarily set booking status to CONFIRMED.");

  try {
    // Perform check-in call
    console.log("Sending PATCH check-in request...");
    const res = await axios.patch(
      `${API_URL}/${bookingId}/check-in`,
      {},
      { headers: { Authorization: caregiverToken } }
    );

    console.log("Check-in response status:", res.status);
    console.log("Check-in response data:", res.data);

    if (res.status === 200 && res.data.success === true && res.data.data.isTrackingActive === true) {
      console.log("Check-in PATCH API call verified successfully!");
    } else {
      throw new Error("Check-in verification failed: status or tracking active mismatch");
    }

    // Verify database update
    const updatedBooking = await Booking.findById(bookingId);
    console.log(`Updated booking in DB: status=${updatedBooking.bookingStatus}, isTrackingActive=${updatedBooking.isTrackingActive}`);
    if (updatedBooking.bookingStatus !== "IN_PROGRESS" || updatedBooking.isTrackingActive !== true) {
      throw new Error("DB was not updated correctly after check-in PATCH");
    }

  } catch (err) {
    console.error("Check-in test failed:", err.message);
    if (err.response) {
      console.error("Response details:", err.response.data);
    }
  } finally {
    // Restore original status
    originalBooking.bookingStatus = "IN_PROGRESS";
    originalBooking.isTrackingActive = true;
    originalBooking.checkInTime = new Date();
    await originalBooking.save();
    console.log("Restored original booking status in DB.");

    await mongoose.disconnect();
    console.log("Check-in tests completed.");
  }
}

setTimeout(runCheckInTests, 2000);
