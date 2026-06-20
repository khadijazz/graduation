require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const Userlog = require('../models/userlog.model');
const Caregiver = require('../models/caregiver.model');
const Booking = require('../models/booking.model');
const Complaint = require('../models/complaint.model');

// Controllers / Services to test
const complaintController = require('../controllers/complaint.controller');
const adminServices = require('../services/admin.services');
const adminController = require('../controllers/admin.conroller');

async function test() {
  await connectDB();
  console.log("Connected to database for testing...");

  // Clean up any leftovers from previous tests
  await Userlog.deleteMany({ email: "testclient@example.com" });
  await Caregiver.deleteMany({ email: "testcaregiver@example.com" });

  // 1. Create client, caregiver, booking, and complaint
  const client = await Userlog.create({
    full_name: "Test Client",
    email: "testclient@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  const caregiver = await Caregiver.create({
    full_name: "Test Caregiver",
    email: "testcaregiver@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "caregiver"
  });

  const Request = require('../models/request.model');
  const Offer = require('../models/offer.model');

  const testRequest = await Request.create({
    client: client._id,
    title: "Test Request",
    Description: "Need help",
    governorate: "Cairo",
    budget: 150
  });

  const testOffer = await Offer.create({
    request: testRequest._id,
    caregiver: caregiver._id,
    price: 150
  });

  const booking = await Booking.create({
    request: testRequest._id,
    offer: testOffer._id,
    client: client._id,
    caregiver: caregiver._id,
    price: 150
  });

  const complaint = await Complaint.create({
    user: client._id,
    booking: booking._id,
    subject: "Test Complaint",
    message: "Late arrival test message",
    complaint_category: "Poor service quality"
  });

  console.log("Created test data successfully!");

  // Now, test Client/Caregiver Complaint Controller
  // Mock req, res
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

  // Test getComplaintDetails
  responseData = null;
  status = null;
  await complaintController.getComplaintDetails({
    params: { complaintId: complaint._id }
  }, mockRes);

  console.log("--- TEST getComplaintDetails ---");
  console.log("Status:", status);
  console.log("Response data:", JSON.stringify(responseData, null, 2));

  // Assertions for details
  if (status !== 200) throw new Error("Expected status 200 for details");
  if (!responseData.data.client || responseData.data.client.id.toString() !== client._id.toString()) throw new Error("Client ID mismatch in details");
  if (responseData.data.client.full_name !== "Test Client") throw new Error("Client full_name mismatch in details");
  if (responseData.data.client.email !== "testclient@example.com") throw new Error("Client email mismatch in details");
  if (!responseData.data.caregiver || responseData.data.caregiver.id.toString() !== caregiver._id.toString()) throw new Error("Caregiver ID mismatch in details");
  if (responseData.data.caregiver.full_name !== "Test Caregiver") throw new Error("Caregiver full_name mismatch in details");
  if (responseData.data.caregiver.email !== "testcaregiver@example.com") throw new Error("Caregiver email mismatch in details");
  if (!responseData.data.booking || responseData.data.booking.id.toString() !== booking._id.toString()) throw new Error("Booking ID mismatch in details");
  console.log("getComplaintDetails assertions passed!");

  // Test getAllComplaints
  responseData = null;
  status = null;
  await complaintController.getAllComplaints({}, mockRes);

  console.log("--- TEST getAllComplaints ---");
  console.log("Status:", status);
  const foundComplaint = responseData.data.complaints.find(c => c.complaintId.toString() === complaint._id.toString());
  if (!foundComplaint) throw new Error("Test complaint not found in all complaints list");
  console.log("Found complaint:", JSON.stringify(foundComplaint, null, 2));

  // Assertions for list
  if (!foundComplaint.client || foundComplaint.client.id.toString() !== client._id.toString()) throw new Error("Client ID mismatch in list");
  if (foundComplaint.client.full_name !== "Test Client") throw new Error("Client full_name mismatch in list");
  if (foundComplaint.client.email !== "testclient@example.com") throw new Error("Client email mismatch in list");
  if (!foundComplaint.caregiver || foundComplaint.caregiver.id.toString() !== caregiver._id.toString()) throw new Error("Caregiver ID mismatch in list");
  if (foundComplaint.caregiver.full_name !== "Test Caregiver") throw new Error("Caregiver full_name mismatch in list");
  if (foundComplaint.caregiver.email !== "testcaregiver@example.com") throw new Error("Caregiver email mismatch in list");
  if (!foundComplaint.booking || foundComplaint.booking.id.toString() !== booking._id.toString()) throw new Error("Booking ID mismatch in list");
  console.log("getAllComplaints assertions passed!");

  // Test Admin controller getComplaints
  responseData = null;
  status = null;
  await adminController.getComplaints({}, mockRes);

  console.log("--- TEST admin getComplaints ---");
  console.log("Status:", status);
  const foundAdminComplaint = responseData.data.complaints.find(c => c.complaintId.toString() === complaint._id.toString());
  if (!foundAdminComplaint) throw new Error("Test complaint not found in admin complaints list");
  console.log("Found admin complaint:", JSON.stringify(foundAdminComplaint, null, 2));

  // Assertions for admin list
  if (!foundAdminComplaint.client || foundAdminComplaint.client.id.toString() !== client._id.toString()) throw new Error("Client ID mismatch in admin list");
  if (foundAdminComplaint.client.full_name !== "Test Client") throw new Error("Client full_name mismatch in admin list");
  if (foundAdminComplaint.client.email !== "testclient@example.com") throw new Error("Client email mismatch in admin list");
  if (!foundAdminComplaint.caregiver || foundAdminComplaint.caregiver.id.toString() !== caregiver._id.toString()) throw new Error("Caregiver ID mismatch in admin list");
  if (foundAdminComplaint.caregiver.full_name !== "Test Caregiver") throw new Error("Caregiver full_name mismatch in admin list");
  if (foundAdminComplaint.caregiver.email !== "testcaregiver@example.com") throw new Error("Caregiver email mismatch in admin list");
  if (!foundAdminComplaint.booking || foundAdminComplaint.booking.id.toString() !== booking._id.toString()) throw new Error("Booking ID mismatch in admin list");
  console.log("admin getComplaints assertions passed!");

  // Test Admin controller getComplaintById
  responseData = null;
  status = null;
  await adminController.getComplaintById({
    params: { id: complaint._id }
  }, mockRes);

  console.log("--- TEST admin getComplaintById ---");
  console.log("Status:", status);
  console.log("Response data:", JSON.stringify(responseData, null, 2));

  // Assertions for admin details
  if (status !== 200) throw new Error("Expected status 200 for admin details");
  if (!responseData.data.complaint.client || responseData.data.complaint.client.id.toString() !== client._id.toString()) throw new Error("Client ID mismatch in admin details");
  if (responseData.data.complaint.client.full_name !== "Test Client") throw new Error("Client full_name mismatch in admin details");
  if (responseData.data.complaint.client.email !== "testclient@example.com") throw new Error("Client email mismatch in admin details");
  if (!responseData.data.complaint.caregiver || responseData.data.complaint.caregiver.id.toString() !== caregiver._id.toString()) throw new Error("Caregiver ID mismatch in admin details");
  if (responseData.data.complaint.caregiver.full_name !== "Test Caregiver") throw new Error("Caregiver full_name mismatch in admin details");
  if (responseData.data.complaint.caregiver.email !== "testcaregiver@example.com") throw new Error("Caregiver email mismatch in admin details");
  if (!responseData.data.complaint.booking || responseData.data.complaint.booking.id.toString() !== booking._id.toString()) throw new Error("Booking ID mismatch in admin details");
  console.log("admin getComplaintById assertions passed!");

  // Clean up
  await Complaint.findByIdAndDelete(complaint._id);
  await Booking.findByIdAndDelete(booking._id);
  await Offer.findByIdAndDelete(testOffer._id);
  await Request.findByIdAndDelete(testRequest._id);
  await Caregiver.findByIdAndDelete(caregiver._id);
  await Userlog.findByIdAndDelete(client._id);
  console.log("Cleaned up test data.");

  console.log("ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

test().catch(async (err) => {
  console.error("Test failed:", err);
  // Attempt cleanups
  try {
    const Userlog = require('../models/userlog.model');
    const Caregiver = require('../models/caregiver.model');
    await Userlog.deleteMany({ email: "testclient@example.com" });
    await Caregiver.deleteMany({ email: "testcaregiver@example.com" });
  } catch (cleanupErr) {
    console.error("Cleanup failed:", cleanupErr);
  }
  process.exit(1);
});
