const mongoose = require("mongoose");
const Userlog = require("../models/userlog.model");
const Caregiver = require("../models/caregiver.model");
const Booking = require("../models/booking.model");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/graduation");
  console.log("Connected to DB");

  const users = await Userlog.find({}).limit(5);
  console.log("=== Users ===");
  users.forEach(u => console.log(`ID: ${u._id}, Role: ${u.role}, Email: ${u.email}, Name: ${u.full_name}, Status: ${u.status}`));

  const caregivers = await Caregiver.find({}).limit(5);
  console.log("=== Caregivers ===");
  caregivers.forEach(c => console.log(`ID: ${c._id}, Role: ${c.role}, Email: ${c.email}, Name: ${c.full_name}, Status: ${c.status}`));

  const bookings = await Booking.find({}).limit(5);
  console.log("=== Bookings ===");
  bookings.forEach(b => console.log(`ID: ${b._id}, Status: ${b.bookingStatus}, Client: ${b.client}, Caregiver: ${b.caregiver}, TrackingActive: ${b.isTrackingActive}`));

  await mongoose.disconnect();
}

run().catch(console.error);
