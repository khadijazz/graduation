require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const Userlog = require('../models/userlog.model');
const Caregiver = require('../models/caregiver.model');
const Request = require('../models/request.model');

// Controller to test
const requestController = require('../controllers/request.controller');

async function test() {
  await connectDB();
  console.log("Connected to database for testing request filtering...");

  // Clean up leftovers
  await Userlog.deleteMany({ email: /filterclient.*@example\.com/ });
  await Caregiver.deleteMany({ email: /filtercg.*@example\.com/ });

  // 1. Create client
  const client = await Userlog.create({
    full_name: "Filter Client",
    email: "filterclient@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  // 2. Create 2 caregivers: Elderly Care vs Pet Care
  const cgElderly = await Caregiver.create({
    full_name: "Filter Caregiver Elderly",
    email: "filtercgelderly@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    speciality: "elderly care"
  });

  const cgPet = await Caregiver.create({
    full_name: "Filter Caregiver Pet",
    email: "filtercgpet@example.com",
    password: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    speciality: "pet care"
  });

  // 3. Create 2 requests: Elderly Care vs Pet Care
  const reqElderly = await Request.create({
    client: client._id,
    title: "Elderly Care Request",
    Description: "Need assistance with elderly care",
    governorate: "Cairo",
    budget: 200,
    serviceType: "Elderly Care"
  });

  const reqPet = await Request.create({
    client: client._id,
    title: "Pet Care Request",
    Description: "Need assistance with walking dogs",
    governorate: "Cairo",
    budget: 150,
    serviceType: "Pet Care"
  });

  console.log("Created test clients, caregivers, and requests successfully.");

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

  // --- Test 1: Elderly Care caregiver retrieves available requests ---
  responseData = null;
  status = null;
  await requestController.getAvailableRequests({
    user: cgElderly
  }, mockRes);

  console.log("--- TEST 1: Elderly Care Caregiver ---");
  console.log("Status:", status);
  console.log("Results count:", responseData.results);

  // Assertions for Elderly Care Caregiver
  if (status !== 200) throw new Error("Expected status 200 for cgElderly");
  const elderlyCGRequests = responseData.data;
  const hasElderlyReq = elderlyCGRequests.some(r => r._id.toString() === reqElderly._id.toString());
  const hasPetReq = elderlyCGRequests.some(r => r._id.toString() === reqPet._id.toString());

  if (!hasElderlyReq) throw new Error("Elderly caregiver failed to retrieve the Elderly Care request");
  if (hasPetReq) throw new Error("Elderly caregiver retrieved a Pet Care request (cross-service leaking)");
  console.log("Test 1 passed successfully!");

  // --- Test 2: Pet Care caregiver retrieves available requests ---
  responseData = null;
  status = null;
  await requestController.getAvailableRequests({
    user: cgPet
  }, mockRes);

  console.log("--- TEST 2: Pet Care Caregiver ---");
  console.log("Status:", status);
  console.log("Results count:", responseData.results);

  // Assertions for Pet Care Caregiver
  if (status !== 200) throw new Error("Expected status 200 for cgPet");
  const petCGRequests = responseData.data;
  const hasElderlyReq2 = petCGRequests.some(r => r._id.toString() === reqElderly._id.toString());
  const hasPetReq2 = petCGRequests.some(r => r._id.toString() === reqPet._id.toString());

  if (hasElderlyReq2) throw new Error("Pet caregiver retrieved an Elderly Care request (cross-service leaking)");
  if (!hasPetReq2) throw new Error("Pet caregiver failed to retrieve the Pet Care request");
  console.log("Test 2 passed successfully!");

  // Clean up
  await Request.findByIdAndDelete(reqElderly._id);
  await Request.findByIdAndDelete(reqPet._id);
  await Caregiver.findByIdAndDelete(cgElderly._id);
  await Caregiver.findByIdAndDelete(cgPet._id);
  await Userlog.findByIdAndDelete(client._id);

  console.log("Cleaned up stats test records.");
  console.log("ALL REQUEST FILTERING TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

test().catch(async (err) => {
  console.error("Filtering test failed:", err);
  // Attempt cleanups
  try {
    const Userlog = require('../models/userlog.model');
    const Caregiver = require('../models/caregiver.model');
    await Userlog.deleteMany({ email: /filterclient.*@example\.com/ });
    await Caregiver.deleteMany({ email: /filtercg.*@example\.com/ });
  } catch (cleanErr) {
    console.error("Cleanup failed:", cleanErr);
  }
  process.exit(1);
});
