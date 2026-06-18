const io = require("socket.io-client");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const SOCKET_URL = "http://localhost:4000";
const API_URL = "http://localhost:4000/booking";
const JWT_SECRET = "this-is-my-very-long-secret-key";

// Test IDs
const activeBookingId = "6a33df780b828ce374e63c6e";
const activeClientId = "6a2d9d5d0f63b26fadc10efc";
const activeCaregiverId = "6a2d671c0f63b26fadc10ef0";

const completedBookingId = "6a340f650b828ce374e63c89";
const completedCaregiverId = "6a33edef0b828ce374e63c7e";

// Generate tokens dynamically
const clientToken = "Bearer " + jwt.sign({ id: activeClientId }, JWT_SECRET);
const caregiverToken = "Bearer " + jwt.sign({ id: activeCaregiverId }, JWT_SECRET);
const completedCaregiverToken = "Bearer " + jwt.sign({ id: completedCaregiverId }, JWT_SECRET);

async function runTests() {
  console.log("Starting Caregiver Location Socket & REST API tests...");

  let clientSocket;
  let caregiverSocket;
  let completedCaregiverSocket;

  try {
    // 1. Connect sockets
    caregiverSocket = io(SOCKET_URL, { auth: { token: caregiverToken } });
    clientSocket = io(SOCKET_URL, { auth: { token: clientToken } });
    completedCaregiverSocket = io(SOCKET_URL, { auth: { token: completedCaregiverToken } });

    await new Promise((resolve, reject) => {
      let connected = 0;
      const checkConnected = () => {
        connected++;
        if (connected === 3) resolve();
      };
      caregiverSocket.on("connect", checkConnected);
      clientSocket.on("connect", checkConnected);
      completedCaregiverSocket.on("connect", checkConnected);
      caregiverSocket.on("connect_error", reject);
      clientSocket.on("connect_error", reject);
      completedCaregiverSocket.on("connect_error", reject);
    });
    console.log("All test sockets connected successfully.");

    // 2. Join booking room
    await new Promise((resolve) => {
      clientSocket.emit("join_booking", { bookingId: activeBookingId }, (res) => {
        console.log("Client join room response:", res);
        resolve();
      });
    });

    await new Promise((resolve) => {
      caregiverSocket.emit("join_booking", { bookingId: activeBookingId }, (res) => {
        console.log("Caregiver join room response:", res);
        resolve();
      });
    });

    // 3. Test live location update & broadcast
    const testCoordinates = {
      bookingId: activeBookingId,
      lat: 29.123456,
      lng: 31.654321
    };

    console.log("Emitting location_update from caregiver...");
    
    const locationChangedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for location_changed event"));
      }, 5000);

      clientSocket.on("location_changed", (data) => {
        console.log("Received location_changed on client socket:", data);
        if (data.bookingId === activeBookingId && data.lat === testCoordinates.lat && data.lng === testCoordinates.lng) {
          clearTimeout(timeout);
          resolve(data);
        }
      });
    });

    await new Promise((resolve) => {
      caregiverSocket.emit("location_update", testCoordinates, (res) => {
        console.log("Caregiver location_update acknowledgment:", res);
        resolve();
      });
    });

    await locationChangedPromise;
    console.log("Location update and broadcast verified successfully!");

    // 4. Test REST API: GET /booking/:id/location
    console.log("Fetching location via REST API...");
    const restRes = await axios.get(`${API_URL}/${activeBookingId}/location`, {
      headers: { Authorization: clientToken }
    });
    console.log("REST API Response status:", restRes.status);
    console.log("REST API Response data:", restRes.data);
    if (restRes.data.status === "success" && restRes.data.data.latitude === testCoordinates.lat && restRes.data.data.longitude === testCoordinates.lng) {
      console.log("REST API verification successful!");
    } else {
      throw new Error("REST API verification failed: data mismatch");
    }

    // 5. Test location update on completed booking by its assigned caregiver
    console.log("Testing location update on a completed booking by its assigned caregiver...");
    await new Promise((resolve) => {
      completedCaregiverSocket.emit("location_update", {
        bookingId: completedBookingId,
        lat: 29.000,
        lng: 31.000
      }, (res) => {
        console.log("Completed booking update response (expected error):", res);
        if (res.status === "error" && res.message.includes("Tracking is not active")) {
          console.log("Completed booking location update block verified successfully.");
        } else {
          console.error("Warning: completed booking update did not fail as expected", res);
        }
        resolve();
      });
    });

    // 6. Test REST API on completed booking by authorized client (should return 409 Tracking Not Active)
    console.log("Testing REST API retrieval on completed booking by authorized client...");
    try {
      await axios.get(`${API_URL}/${completedBookingId}/location`, {
        headers: { Authorization: clientToken }
      });
      console.error("Warning: completed booking REST retrieval did not throw 409");
    } catch (err) {
      console.log("Completed booking REST retrieval response (expected error):", err.response?.status, err.response?.data);
      if (err.response?.status === 409) {
        console.log("Completed booking REST retrieval 409 verified successfully.");
      } else {
        console.error("Warning: expected 409 but got", err.response?.status);
      }
    }

    // 7. Test unauthorized booking access
    console.log("Testing unauthorized join room attempt...");
    // Completed booking caregiver is NOT part of active booking room.
    await new Promise((resolve) => {
      completedCaregiverSocket.emit("join_booking", { bookingId: activeBookingId }, (res) => {
        console.log("Unauthorized join room response (expected error):", res);
        if (res.status === "error" && res.message.includes("Unauthorized")) {
          console.log("Unauthorized join room block verified successfully.");
        } else {
          console.error("Warning: unauthorized join room did not fail as expected", res);
        }
        resolve();
      });
    });

  } catch (err) {
    console.error("Test execution failed:", err.message);
    if (err.response) {
      console.error("Response details:", err.response.data);
    }
  } finally {
    if (clientSocket) clientSocket.close();
    if (caregiverSocket) caregiverSocket.close();
    if (completedCaregiverSocket) completedCaregiverSocket.close();
    console.log("Tests completed.");
  }
}

setTimeout(runTests, 2000);
