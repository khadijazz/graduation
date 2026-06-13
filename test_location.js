require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./config/database");

const Booking = require("./models/booking.model");
const Userlog = require("./models/userlog.model");
const CaregiverModel = require("./models/caregiver.model");
const Request = require("./models/request.model");
const Offer = require("./models/offer.model");
const CaregiverLocation = require("./models/caregiverLocation.model");
const taskController = require("./controllers/task.controller");
const locationController = require("./controllers/location.controller");

const runTests = async () => {
  console.log("Connecting to Database...");
  await connectDB();
  console.log("Connected to MongoDB.");

  // Clean up any old test data
  console.log("Cleaning up old test data...");
  await Userlog.deleteMany({ email: { $in: ["test_client@test.com", "other_client@test.com"] } });
  await CaregiverModel.deleteMany({ email: { $in: ["test_caregiver@test.com", "other_caregiver@test.com"] } });
  await CaregiverLocation.deleteMany({}); // clear any previous location updates

  console.log("Creating Test Users...");
  const client = await Userlog.create({
    full_name: "Test Client",
    email: "test_client@test.com",
    password: "Password123!",
    passwordConfirmation: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  const otherClient = await Userlog.create({
    full_name: "Other Client",
    email: "other_client@test.com",
    password: "Password123!",
    passwordConfirmation: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  const caregiver = await CaregiverModel.create({
    full_name: "Test Caregiver",
    email: "test_caregiver@test.com",
    password: "Password123!",
    passwordConfirmation: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    speciality: "elderly care",
    status: "Verified"
  });

  const otherCaregiver = await CaregiverModel.create({
    full_name: "Other Caregiver",
    email: "other_caregiver@test.com",
    password: "Password123!",
    passwordConfirmation: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    speciality: "elderly care",
    status: "Verified"
  });

  console.log("Creating Test Request, Offer and Booking...");
  const request = await Request.create({
    client: client._id,
    caregiver: caregiver._id,
    governorate: "Cairo",
    budget: 500,
    status: "ACCEPTED"
  });

  const offer = await Offer.create({
    request: request._id,
    caregiver: caregiver._id,
    price: 500,
    status: "accepted"
  });

  const booking = await Booking.create({
    request: request._id,
    offer: offer._id,
    client: client._id,
    caregiver: caregiver._id,
    price: 500,
    bookingStatus: "ACCEPTED",
    isTrackingActive: false
  });

  const helperMockRes = () => {
    return {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  };

  const expectError = async (apiCall, expectedStatus, expectedMessageSub) => {
    let thrownError = null;
    const next = (err) => {
      thrownError = err;
    };

    await apiCall(next);

    if (!thrownError) {
      throw new Error(`Expected error with status ${expectedStatus} but it succeeded`);
    }

    const actualStatus = thrownError.statusCode || thrownError.status || 500;
    if (actualStatus !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${actualStatus}. Error: ${thrownError.message}`);
    }
    if (expectedMessageSub && !thrownError.message.toLowerCase().includes(expectedMessageSub.toLowerCase())) {
      throw new Error(`Expected message to contain "${expectedMessageSub}", got "${thrownError.message}"`);
    }
    console.log(`✅ Received expected error: [${actualStatus}] ${thrownError.message}`);
  };

  const handleNextSuccess = (err) => {
    if (err) {
      throw err;
    }
  };

  console.log("\n--- Starting Live Location Tracking Tests ---");

  // 1. Client attempts to view location before check-in (should fail with 400)
  console.log("\nTest 1: Client attempts to view location before check-in (should fail)");
  await expectError(
    (next) => locationController.getLocation({ params: { bookingId: booking._id }, user: client }, helperMockRes(), next),
    400,
    "cannot view location before check-in"
  );

  // 2. Caregiver attempts to send location updates before check-in (should fail with 400)
  console.log("\nTest 2: Caregiver attempts to send location updates before check-in (should fail)");
  await expectError(
    (next) => locationController.updateLocation({
      params: { bookingId: booking._id },
      body: { latitude: 30.05, longitude: 31.23 },
      user: caregiver
    }, helperMockRes(), next),
    400,
    "location updates are only allowed for active bookings"
  );

  // 3. Perform Check-In
  console.log("\nTest 3: Perform Check-In (should set isTrackingActive to true and status to IN_PROGRESS)");
  const checkInRes = helperMockRes();
  await taskController.checkIn({ params: { id: booking._id }, user: caregiver }, checkInRes, handleNextSuccess);
  if (checkInRes.statusCode !== 200) {
    throw new Error(`Check-in failed with status ${checkInRes.statusCode}: ${JSON.stringify(checkInRes.body)}`);
  }
  const updatedBooking = await Booking.findById(booking._id);
  if (updatedBooking.bookingStatus !== "IN_PROGRESS" || !updatedBooking.isTrackingActive) {
    throw new Error(`Booking status is ${updatedBooking.bookingStatus}, isTrackingActive is ${updatedBooking.isTrackingActive}`);
  }
  if (checkInRes.body.data.isTrackingActive !== true) {
    throw new Error(`Expected isTrackingActive to be true in checkIn response data`);
  }
  console.log("✅ Checked in successfully. Booking status:", updatedBooking.bookingStatus, "isTrackingActive:", updatedBooking.isTrackingActive);

  // 4. Caregiver sends location update with valid coordinates (should succeed)
  console.log("\nTest 4: Caregiver sends valid location update (should succeed)");
  const updateRes = helperMockRes();
  await locationController.updateLocation({
    params: { bookingId: booking._id },
    body: { latitude: 30.0444, longitude: 31.2357 },
    user: caregiver
  }, updateRes, handleNextSuccess);
  if (updateRes.statusCode !== 200 || !updateRes.body.success) {
    throw new Error(`Location update failed: ${JSON.stringify(updateRes.body)}`);
  }
  console.log("✅ Location updated successfully. Coordinates stored:", updateRes.body.data.latitude, updateRes.body.data.longitude);

  // 5. Unauthorized caregiver attempts to send location updates (should fail with 403)
  console.log("\nTest 5: Unauthorized caregiver attempts to update location (should fail)");
  await expectError(
    (next) => locationController.updateLocation({
      params: { bookingId: booking._id },
      body: { latitude: 30.05, longitude: 31.24 },
      user: otherCaregiver
    }, helperMockRes(), next),
    403,
    "unauthorized"
  );

  // 6. Caregiver sends location update with invalid coordinates (should fail with 400)
  console.log("\nTest 6: Caregiver sends invalid coordinates (should fail)");
  await expectError(
    (next) => locationController.updateLocation({
      params: { bookingId: booking._id },
      body: { latitude: 95.0, longitude: 31.23 },
      user: caregiver
    }, helperMockRes(), next),
    400,
    "latitude must be between -90 and 90"
  );

  await expectError(
    (next) => locationController.updateLocation({
      params: { bookingId: booking._id },
      body: { latitude: 30.0, longitude: -200 },
      user: caregiver
    }, helperMockRes(), next),
    400,
    "longitude between -180 and 180"
  );

  await expectError(
    (next) => locationController.updateLocation({
      params: { bookingId: booking._id },
      body: { latitude: "thirty", longitude: 31.23 },
      user: caregiver
    }, helperMockRes(), next),
    400,
    "must be numbers"
  );

  // 7. Unauthorized client attempts to retrieve location (should fail with 403)
  console.log("\nTest 7: Unauthorized client attempts to retrieve location (should fail)");
  await expectError(
    (next) => locationController.getLocation({ params: { bookingId: booking._id }, user: otherClient }, helperMockRes(), next),
    403,
    "unauthorized"
  );

  // 8. Authorized client retrieves location (should succeed and return correct data)
  console.log("\nTest 8: Authorized client retrieves caregiver live location (should succeed)");
  const getLocRes = helperMockRes();
  await locationController.getLocation({ params: { bookingId: booking._id }, user: client }, getLocRes, handleNextSuccess);
  if (getLocRes.statusCode !== 200 || !getLocRes.body.success) {
    throw new Error(`Get location failed: ${JSON.stringify(getLocRes.body)}`);
  }
  const locData = getLocRes.body.data;
  if (locData.latitude !== 30.0444 || locData.longitude !== 31.2357) {
    throw new Error(`Incorrect coordinates returned: ${JSON.stringify(locData)}`);
  }
  console.log("✅ Client retrieved caregiver location successfully. Lat:", locData.latitude, "Lon:", locData.longitude);

  // 9. Perform Check-Out
  console.log("\nTest 9: Perform Check-Out (should set isTrackingActive to false and status to COMPLETED)");
  const checkOutRes = helperMockRes();
  await taskController.checkOut({ params: { bookingId: booking._id }, user: caregiver }, checkOutRes, handleNextSuccess);
  if (checkOutRes.statusCode !== 200) {
    throw new Error(`Check-out failed with status ${checkOutRes.statusCode}: ${JSON.stringify(checkOutRes.body)}`);
  }
  const finalBooking = await Booking.findById(booking._id);
  if (finalBooking.bookingStatus !== "COMPLETED" || finalBooking.isTrackingActive) {
    throw new Error(`Booking status is ${finalBooking.bookingStatus}, isTrackingActive is ${finalBooking.isTrackingActive}`);
  }
  if (checkOutRes.body.data.isTrackingActive !== false) {
    throw new Error(`Expected isTrackingActive to be false in checkOut response data`);
  }
  console.log("✅ Checked out successfully. Booking status:", finalBooking.bookingStatus, "isTrackingActive:", finalBooking.isTrackingActive);

  // 10. Client attempts to view location after check-out (should fail with 400)
  console.log("\nTest 10: Client attempts to view location after check-out (should fail)");
  await expectError(
    (next) => locationController.getLocation({ params: { bookingId: booking._id }, user: client }, helperMockRes(), next),
    400,
    "cannot view location after check-out"
  );

  // 11. Caregiver attempts to send location updates after check-out (should fail with 400)
  console.log("\nTest 11: Caregiver attempts to update location after check-out (should fail)");
  await expectError(
    (next) => locationController.updateLocation({
      params: { bookingId: booking._id },
      body: { latitude: 30.05, longitude: 31.23 },
      user: caregiver
    }, helperMockRes(), next),
    400,
    "location updates are only allowed for active bookings"
  );

  console.log("\n--- Cleaning Up Database ---");
  await CaregiverLocation.deleteMany({});
  await Booking.findByIdAndDelete(booking._id);
  await Offer.findByIdAndDelete(offer._id);
  await Request.findByIdAndDelete(request._id);
  await Userlog.deleteMany({ email: { $in: ["test_client@test.com", "other_client@test.com"] } });
  await CaregiverModel.deleteMany({ email: { $in: ["test_caregiver@test.com", "other_caregiver@test.com"] } });

  console.log("\n🎉 ALL LIVE LOCATION TRACKING TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
};

runTests().catch(err => {
  console.error("❌ TEST RUN FAILED:", err);
  process.exit(1);
});
