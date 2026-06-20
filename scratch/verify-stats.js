require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const Userlog = require('../models/userlog.model');
const Caregiver = require('../models/caregiver.model');
const Booking = require('../models/booking.model');
const Request = require('../models/request.model');
const Offer = require('../models/offer.model');

// Controller to test
const adminController = require('../controllers/admin.conroller');

async function test() {
  await connectDB();
  console.log("Connected to database for testing statistics...");

  // Capture current counts
  const startUsers = await Userlog.countDocuments({});
  const startVerifiedCaregivers = await Caregiver.countDocuments({ status: "Verified" });
  const startAcceptedBookings = await Booking.countDocuments({ bookingStatus: "ACCEPTED" });

  console.log(`Starting counts - Clients: ${startUsers}, Verified Caregivers: ${startVerifiedCaregivers}, Accepted Bookings: ${startAcceptedBookings}`);

  // Create temporary test records
  // 1. Create 2 client users
  const client1 = await Userlog.create({
    full_name: "Stat Client 1",
    email: "statclient1@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  const client2 = await Userlog.create({
    full_name: "Stat Client 2",
    email: "statclient2@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  // 2. Create 1 verified caregiver, 1 pending caregiver
  const caregiverVerified = await Caregiver.create({
    full_name: "Stat Caregiver Verified",
    email: "statcgv@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    status: "Verified"
  });

  const caregiverPending = await Caregiver.create({
    full_name: "Stat Caregiver Pending",
    email: "statcgp@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    status: "Pending Approval"
  });

  // 3. Create requests and offers to link bookings
  const testRequest = await Request.create({
    client: client1._id,
    title: "Stat Test Request",
    Description: "Need help",
    governorate: "Cairo",
    budget: 100,
    serviceType: "Elderly Care"
  });

  const offer1 = await Offer.create({
    request: testRequest._id,
    caregiver: caregiverVerified._id,
    price: 100
  });

  // 4. Create 1 ACCEPTED booking
  const bookingAccepted = await Booking.create({
    request: testRequest._id,
    offer: offer1._id,
    client: client1._id,
    caregiver: caregiverVerified._id,
    price: 100,
    bookingStatus: "ACCEPTED"
  });

  // 5. Create 1 PENDING booking
  const bookingPending = await Booking.create({
    request: testRequest._id,
    offer: offer1._id,
    client: client1._id,
    caregiver: caregiverVerified._id,
    price: 100,
    bookingStatus: "PENDING"
  });

  console.log("Created stats test records successfully.");

  // Mock res object
  let responseData = null;
  let status = null;

  const mockRes = {
    status: function(s) {
      status = s;
      return this;
    },
    json: function(d) {
      responseData = d;
      return this;
    }
  };

  // Run controller method
  await adminController.getDashboardStats({}, mockRes);

  console.log("--- TEST getDashboardStats Response ---");
  console.log("Status:", status);
  console.log("Response data:", JSON.stringify(responseData, null, 2));

  // Assertions
  if (status !== 200) throw new Error("Expected status 200");
  if (responseData.data.totalUsers !== startUsers + 2) {
    throw new Error(`Expected totalUsers to be ${startUsers + 2}, got ${responseData.data.totalUsers}`);
  }
  if (responseData.data.totalProviders !== startVerifiedCaregivers + 1) {
    throw new Error(`Expected totalProviders to be ${startVerifiedCaregivers + 1}, got ${responseData.data.totalProviders}`);
  }
  if (responseData.data.activeBookings !== startAcceptedBookings + 1) {
    throw new Error(`Expected activeBookings to be ${startAcceptedBookings + 1}, got ${responseData.data.activeBookings}`);
  }

  console.log("Stats assertions passed successfully!");

  // Clean up
  await Booking.findByIdAndDelete(bookingAccepted._id);
  await Booking.findByIdAndDelete(bookingPending._id);
  await Offer.findByIdAndDelete(offer1._id);
  await Request.findByIdAndDelete(testRequest._id);
  await Caregiver.findByIdAndDelete(caregiverVerified._id);
  await Caregiver.findByIdAndDelete(caregiverPending._id);
  await Userlog.findByIdAndDelete(client1._id);
  await Userlog.findByIdAndDelete(client2._id);

  console.log("Cleaned up stats test records.");
  console.log("ALL STATS TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

test().catch(async (err) => {
  console.error("Stats test failed:", err);
  // Attempt to clean up
  try {
    const Userlog = require('../models/userlog.model');
    const Caregiver = require('../models/caregiver.model');
    await Userlog.deleteMany({ email: /statclient.*@example\.com/ });
    await Caregiver.deleteMany({ email: /statcg.*@example\.com/ });
  } catch (cleanErr) {
    console.error("Cleanup error:", cleanErr);
  }
  process.exit(1);
});
