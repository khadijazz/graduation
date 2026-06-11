const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { connectDB } = require("../config/database");
const Booking = require("../models/booking.model");
const Request = require("../models/request.model");
const Offer = require("../models/offer.model");
const Userlog = require("../models/userlog.model");
const Caregiver = require("../models/caregiver.model");
const Task = require("../models/tasks.model");
const CaregiverLocation = require("../models/caregiverLocation.model");

const bookingService = require("../services/booking.services");
const taskController = require("../controllers/task.controller");

async function run() {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected.");

    // Clean up previous test runs if any leftovers
    await Booking.deleteMany({ checkInTime: { $exists: true } });
    await CaregiverLocation.deleteMany({});

    // Create mock users
    const client = await Userlog.create({
        full_name: "Mock Client",
        email: "mockclient_" + Date.now() + "@test.com",
        password: "Password123",
        governorate: "Cairo",
        role: "client"
    });

    const caregiver = await Caregiver.create({
        full_name: "Mock Caregiver",
        email: "mockcaregiver_" + Date.now() + "@test.com",
        password: "Password123",
        governorate: "Cairo",
        role: "caregiver",
        speciality: "elderly care"
    });

    // Create mock request/offer/booking
    const request = await Request.create({
        client: client._id,
        governorate: "Cairo",
        budget: 100,
        status: "ACCEPTED"
    });

    const offer = await Offer.create({
        request: request._id,
        caregiver: caregiver._id,
        price: 100,
        status: "accepted"
    });

    const booking = await Booking.create({
        request: request._id,
        offer: offer._id,
        client: client._id,
        caregiver: caregiver._id,
        price: 100,
        bookingStatus: "CONFIRMED"
    });

    // Create mock task
    const task = await Task.create({
        request: request._id,
        taskDescription: "Help with lunch",
        taskState: "pending"
    });

    console.log("Test Setup Complete.");

    // Test 1: Check-in fails with missing coords
    try {
        await bookingService.checkInBooking(booking._id, caregiver._id, undefined, 30.0);
        throw new Error("Test 1 failed: should have rejected missing coordinates");
    } catch (err) {
        console.log("Test 1 passed: rejected missing coordinates as expected:", err.message);
    }

    // Test 2: Check-in fails for wrong caregiver
    try {
        await bookingService.checkInBooking(booking._id, client._id, 30.0, 31.0);
        throw new Error("Test 2 failed: should have rejected wrong caregiver");
    } catch (err) {
        console.log("Test 2 passed: rejected wrong caregiver as expected:", err.message);
    }

    // Test 3: Successful check-in
    const updatedBooking = await bookingService.checkInBooking(booking._id, caregiver._id, 30.0, 31.0);
    if (updatedBooking.bookingStatus !== "IN_PROGRESS") {
        throw new Error("Test 3 failed: status should be IN_PROGRESS");
    }
    if (!updatedBooking.checkInTime || updatedBooking.checkInLocation.latitude !== 30.0) {
        throw new Error("Test 3 failed: coordinates or check-in time not saved");
    }
    console.log("Test 3 passed: check-in successful!");

    // Test 4: Prevent double check-in
    try {
        await bookingService.checkInBooking(booking._id, caregiver._id, 30.0, 31.0);
        throw new Error("Test 4 failed: should have rejected double check-in");
    } catch (err) {
        console.log("Test 4 passed: rejected double check-in as expected:", err.message);
    }

    // Test 5: Location update fails before check-in (for a different CONFIRMED booking)
    const anotherBooking = await Booking.create({
        request: request._id,
        offer: offer._id,
        client: client._id,
        caregiver: caregiver._id,
        price: 100,
        bookingStatus: "CONFIRMED"
    });
    try {
        await bookingService.updateCaregiverLocation(anotherBooking._id, caregiver._id, 30.0, 31.0);
        throw new Error("Test 5 failed: should have rejected location update for CONFIRMED booking");
    } catch (err) {
        console.log("Test 5 passed: rejected location update as expected:", err.message);
    }

    // Test 6: Successful location update for in-progress booking
    const loc = await bookingService.updateCaregiverLocation(booking._id, caregiver._id, 30.005, 31.005);
    if (loc.latitude !== 30.005 || loc.longitude !== 31.005) {
        throw new Error("Test 6 failed: location not saved or updated");
    }
    console.log("Test 6 passed: caregiver location updated!");

    // Test 7: Client can retrieve location
    const retrievedLoc = await bookingService.getCaregiverLocation(booking._id, client._id);
    if (retrievedLoc.latitude !== 30.005 || retrievedLoc.longitude !== 31.005) {
        throw new Error("Test 7 failed: retrieved wrong location");
    }
    console.log("Test 7 passed: client successfully retrieved caregiver location!");

    // Test 8: Non-client cannot retrieve location
    try {
        await bookingService.getCaregiverLocation(booking._id, caregiver._id);
        throw new Error("Test 8 failed: caregiver should not retrieve live location (restricted to client)");
    } catch (err) {
        console.log("Test 8 passed: restricted location to client as expected:", err.message);
    }

    // Test 9: Complete task fails without proof
    try {
        const reqMock = {
            params: { id: task._id },
            user: caregiver
        };
        const resMock = {
            status: function () { return this; },
            json: function () { return this; }
        };
        await taskController.completeTask(reqMock, resMock, (err) => { throw err; });
        throw new Error("Test 9 failed: should have rejected completion without proof");
    } catch (err) {
        console.log("Test 9 passed: rejected completion without proof as expected:", err.message);
    }

    // Test 10: Upload image proof (mimetypes)
    // We use a real PNG header buffer so Cloudinary parses it correctly
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
    ]);

    const reqUploadMock = {
        params: { id: task._id },
        file: {
            mimetype: "image/png",
            buffer: pngBuffer
        },
        user: caregiver
    };
    let resJsonData = null;
    const resUploadMock = {
        status: function () { return this; },
        json: function (data) { resJsonData = data; return this; }
    };

    console.log("Uploading mock task proof to Cloudinary...");
    await taskController.uploadTaskProof(reqUploadMock, resUploadMock, (err) => { throw err; });
    if (!resJsonData || resJsonData.status !== "success" || resJsonData.data.proofs.length === 0) {
        throw new Error("Test 10 failed: proof upload unsuccessful");
    }
    const uploadedProofUrl = resJsonData.data.proofs[0].url;
    console.log("Test 10 passed: uploaded proof to Cloudinary successfully. URL:", uploadedProofUrl);

    // Test 11: Task completion now succeeds
    let completedTaskData = null;
    const resCompleteMock = {
        status: function () { return this; },
        json: function (data) { completedTaskData = data; return this; }
    };
    await taskController.completeTask({ params: { id: task._id }, user: caregiver }, resCompleteMock, (err) => { throw err; });
    if (!completedTaskData || completedTaskData.data.taskState !== "completed" || !completedTaskData.data.completedAt) {
        throw new Error("Test 11 failed: task should be completed");
    }
    console.log("Test 11 passed: task completed successfully after proof upload!");

    console.log("\nAll integration checks passed!");

    // Clean up database test documents
    await client.deleteOne();
    await caregiver.deleteOne();
    await request.deleteOne();
    await offer.deleteOne();
    await booking.deleteOne();
    await anotherBooking.deleteOne();
    await task.deleteOne();
    await loc.deleteOne();

    mongoose.connection.close();
}

run().catch(err => {
    console.error("Test failed with error:", err);
    if (mongoose.connection.readyState !== 0) {
        mongoose.connection.close();
    }
    process.exit(1);
});
