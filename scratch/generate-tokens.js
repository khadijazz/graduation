const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Userlog = require("../models/userlog.model");
const Caregiver = require("../models/caregiver.model");
const Booking = require("../models/booking.model");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/graduation");
  console.log("Connected to DB");

  // Booking details
  const bookingId = "6a33df780b828ce374e63c6e";
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.error("Booking not found!");
    await mongoose.disconnect();
    return;
  }

  const client = await Userlog.findById(booking.client);
  const caregiver = await Caregiver.findById(booking.caregiver);

  console.log("=== Booking ===");
  console.log(`Booking ID: ${booking._id}`);
  console.log(`Client ID: ${booking.client} (role: ${client?.role}, blocked: ${client?.isBlocked})`);
  console.log(`Caregiver ID: ${booking.caregiver} (role: ${caregiver?.role}, status: ${caregiver?.status}, blocked: ${caregiver?.isBlocked})`);

  const secret = "this-is-my-very-long-secret-key";

  if (client) {
    const clientToken = jwt.sign({ id: client._id }, secret);
    console.log(`Client Token: Bearer ${clientToken}`);
  }
  if (caregiver) {
    const caregiverToken = jwt.sign({ id: caregiver._id }, secret);
    console.log(`Caregiver Token: Bearer ${caregiverToken}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
