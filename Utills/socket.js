const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Userlog = require("../models/userlog.model");
const CaregiverModel = require("../models/caregiver.model");
const adminModel = require("../models/admin.model");
const Booking = require("../models/booking.model");
const CaregiverLocation = require("../models/caregiverLocation.model");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        console.error("Socket connection rejected: Token missing");
        return next(new Error("Authentication error: Token missing"));
      }

      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      const payload = jwt.verify(token, "this-is-my-very-long-secret-key");
      
      let user = await Userlog.findById(payload.id);
      if (!user) {
        user = await CaregiverModel.findById(payload.id);
      }
      if (!user) {
        user = await adminModel.findById(payload.id);
      }

      if (!user) {
        console.error(`Socket connection rejected: User not found for payload ID ${payload.id}`);
        return next(new Error("Authentication error: User no longer exists"));
      }

      if (user.isBlocked) {
        console.error(`Socket connection rejected: User ${user._id} is blocked`);
        return next(new Error("Authentication error: Your account has been blocked. Please contact support."));
      }

      // Check caregiver status if they are a caregiver
      if (user.role === "caregiver") {
        if (user.status === "Pending Approval") {
          console.error(`Socket connection rejected: Caregiver ${user._id} status is Pending Approval`);
          return next(new Error("Authentication error: Your account is pending approval."));
        }
        if (user.status === "Declined") {
          console.error(`Socket connection rejected: Caregiver ${user._id} status is Declined`);
          return next(new Error("Authentication error: Your caregiver application has been declined."));
        }
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error(`Socket authentication error: ${err.message}`);
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket client connected: ${socket.user._id} (${socket.user.role})`);

    // 1. join_booking
    socket.on("join_booking", async (data, callback) => {
      try {
        const { bookingId } = data || {};
        if (!bookingId) {
          throw new Error("Booking ID is required");
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        const isClient = booking.client.toString() === socket.user._id.toString();
        const isCaregiver = booking.caregiver.toString() === socket.user._id.toString();
        const isAdmin = socket.user.role === "admin";

        if (!isClient && !isCaregiver && !isAdmin) {
          throw new Error("Unauthorized access to this booking");
        }

        const roomName = `booking:${bookingId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);

        if (callback) {
          callback({ status: "success", message: `Joined room ${roomName}` });
        }
      } catch (err) {
        console.error(`Error in join_booking from socket ${socket.id}: ${err.message}`);
        socket.emit("error", { event: "join_booking", message: err.message });
        if (callback) {
          callback({ status: "error", message: err.message });
        }
      }
    });

    // 2. leave_booking
    socket.on("leave_booking", (data, callback) => {
      try {
        const { bookingId } = data || {};
        if (!bookingId) {
          throw new Error("Booking ID is required");
        }

        const roomName = `booking:${bookingId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room ${roomName}`);

        if (callback) {
          callback({ status: "success", message: `Left room ${roomName}` });
        }
      } catch (err) {
        console.error(`Error in leave_booking from socket ${socket.id}: ${err.message}`);
        socket.emit("error", { event: "leave_booking", message: err.message });
        if (callback) {
          callback({ status: "error", message: err.message });
        }
      }
    });

    // 3. location_update (emitted by caregiver)
    socket.on("location_update", async (data, callback) => {
      console.log("Location Update Received", data);
      try {
        const { bookingId, lat, lng } = data || {};
        if (!bookingId) {
          throw new Error("Booking ID is required");
        }

        if (lat === undefined || lng === undefined || typeof lat !== "number" || typeof lng !== "number") {
          throw new Error("Invalid coordinates: Latitude and longitude are required and must be numbers");
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error("Invalid coordinates: Latitude must be between -90 and 90, longitude between -180 and 180");
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        // Validate caregiver ownership
        if (booking.caregiver.toString() !== socket.user._id.toString()) {
          throw new Error("Unauthorized: Only the assigned caregiver can send location updates");
        }

        // Validate tracking activity / status
        if (!booking.isTrackingActive) {
          throw new Error("Tracking is not active for this booking");
        }

        // Upsert caregiver location
        const location = await CaregiverLocation.findOneAndUpdate(
          { booking: bookingId },
          {
            caregiver: booking.caregiver,
            latitude: lat,
            longitude: lng
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const broadcastPayload = {
          bookingId,
          lat,
          lng,
          updatedAt: location.updatedAt
        };

        const roomName = `booking:${bookingId}`;
        io.to(roomName).emit("location_changed", broadcastPayload);
        console.log(`Broadcasted location_changed to room ${roomName}:`, broadcastPayload);

        if (callback) {
          callback({ status: "success", data: broadcastPayload });
        }
      } catch (err) {
        console.error(`Error in location_update from socket ${socket.id}: ${err.message}`);
        socket.emit("error", { event: "location_update", message: err.message });
        if (callback) {
          callback({ status: "error", message: err.message });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
