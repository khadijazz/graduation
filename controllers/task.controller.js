const taskServices = require("../services/task.services");
const { ApiError } = require("../Utills/ApiError");
const Booking = require("../models/booking.model");
const Task = require("../models/tasks.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require("../Utills/uploadCloudinary");
const { createNotification } = require("../services/notification.services");

exports.createTasks = async (req, res, next) => {

  const tasksData = req.body.map(task => ({
    ...task,
    request: req.params.id
  }));

  const createdTasks = await taskServices.createTasks(tasksData);

  res.status(201).json({
    message: "tasks created successfully",
    status: "success",
    data: createdTasks
  });
};

exports.getAllTasks = async (req, res, next) => {
  const Task = await taskServices.getalltasks(req.query);
  res.status(200).json({
    message: "tasks retrieved successfully",
    status: "success",
    data: Task
  })
};

exports.checkIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError(
        "Unauthorized: Only assigned caregiver can check in",
        403
      );
    }

    if (booking.bookingStatus === "IN_PROGRESS") {
      throw new ApiError("Booking already checked in", 400);
    }

    if (booking.bookingStatus === "COMPLETED") {
      throw new ApiError("Booking already completed", 400);
    }

    const checkInTime = new Date();

    booking.bookingStatus = "IN_PROGRESS";
    booking.checkInTime = checkInTime;
    booking.isTrackingActive = true;
    await booking.save();

    await createNotification({
      recipientId: booking.client,
      recipientRole: "client",
      notificationType: "CAREGIVER_CHECKED_IN",
      title: "Caregiver Checked In",
      message: "Your caregiver has checked in and started the service.",
      relatedEntityId: booking._id,
      relatedEntityType: "Booking"
    });

    await Task.updateMany(
      { request: booking.request },
      {
        taskState: "In Progress",
        checkInTime,
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking checked in successfully",
      data: {
        bookingId: booking._id,
        bookingStatus: booking.bookingStatus,
        checkInTime,
        isTrackingActive: booking.isTrackingActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.checkOut = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.bookingId).session(session);

    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError(
        "Unauthorized: Only assigned caregiver can check out",
        403
      );
    }

    if (booking.bookingStatus === "COMPLETED") {
      throw new ApiError("Booking is already completed", 400);
    }
    if (booking.paymentReleased) {
      throw new ApiError("Payment has already been released for this booking", 400);
    }

    if (booking.bookingStatus !== "IN_PROGRESS") {
      throw new ApiError(
        "Booking must be checked in first",
        400
      );
    }

    const checkOutTime = new Date();

    // 1. Retrieve booking amount & deduct from client hold balance
    const clientWallet = await Wallet.findOne({ userlog: booking.client }).session(session);
    if (!clientWallet) {
      throw new ApiError("Client wallet not found", 404);
    }
    if ((clientWallet.holdBalance || 0) < booking.price) {
      throw new ApiError("Insufficient hold balance in client wallet", 400);
    }
    clientWallet.holdBalance = (clientWallet.holdBalance || 0) - booking.price;
    if (clientWallet.holdBalance < 0) {
      clientWallet.holdBalance = 0;
    }
    await clientWallet.save({ session });

    // 2. Mark the held transaction as settled
    const heldTransaction = await Transaction.findOne({
      booking: booking._id,
      type: "BOOKING_PAYMENT",
      status: "COMPLETED"
    }).session(session);

    if (heldTransaction) {
      heldTransaction.isSettled = true;
      await heldTransaction.save({ session });
    }

    // 3. Add booking earnings to caregiver's wallet
    const caregiverWallet = await Wallet.findOne({ userlog: booking.caregiver }).session(session);
    if (!caregiverWallet) {
      throw new ApiError("Caregiver wallet not found", 404);
    }
    caregiverWallet.balance = (caregiverWallet.balance || 0) + booking.price;
    caregiverWallet.totalEarned = (caregiverWallet.totalEarned || 0) + booking.price;
    await caregiverWallet.save({ session });

    // 4. Create caregiver's transaction record
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "request",
        populate: { path: "service" }
      })
      .session(session);

    const serviceName = populatedBooking?.request?.service?.serviceName || "Care Service";

    const caregiverTransaction = new Transaction({
      userlog: booking.caregiver,
      ownerModel: "Caregiver",
      wallet: caregiverWallet._id,
      booking: booking._id,
      client: booking.client,
      caregiver: booking.caregiver,
      serviceName: serviceName,
      amount: booking.price,
      type: "BOOKING_SETTLEMENT",
      status: "COMPLETED",
      paymentMethod: "CARD",
    });
    await caregiverTransaction.save({ session });

    caregiverWallet.transactions.push(caregiverTransaction._id);
    await caregiverWallet.save({ session });

    // 5. Update booking status and payment released status
    booking.bookingStatus = "COMPLETED";
    booking.checkOutTime = checkOutTime;
    booking.isTrackingActive = false;
    booking.paymentReleased = true;
    await booking.save({ session });

    await createNotification({
      recipientId: booking.client,
      recipientRole: "client",
      notificationType: "CAREGIVER_CHECKED_OUT",
      title: "Caregiver Checked Out",
      message: "Your caregiver has checked out and completed the service session.",
      relatedEntityId: booking._id,
      relatedEntityType: "Booking"
    });

    await createNotification({
      recipientId: booking.client,
      recipientRole: "client",
      notificationType: "BOOKING_COMPLETED",
      title: "Booking Completed",
      message: "Booking completed successfully.",
      relatedEntityId: booking._id,
      relatedEntityType: "Booking"
    });

    await createNotification({
      recipientId: booking.caregiver,
      recipientRole: "caregiver",
      notificationType: "BOOKING_COMPLETED",
      title: "Booking Completed",
      message: "Booking completed successfully.",
      relatedEntityId: booking._id,
      relatedEntityType: "Booking"
    });

    await Task.updateMany(
      {
        request: booking.request,
        taskState: { $ne: "Completed" },
      },
      {
        taskState: "Completed",
        checkOutTime,
        completedAt: checkOutTime,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Booking checked out successfully",
      data: {
        bookingId: booking._id,
        bookingStatus: booking.bookingStatus,
        checkOutTime,
        isTrackingActive: booking.isTrackingActive,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.uploadProof = async (req, res, next) => {
  try {
    const task = await taskServices.gettasksbyid(req.params.id);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const booking = await Booking.findOne({ request: task.request });
    if (!booking) {
      throw new ApiError("Unauthorized: No booking associated with this task's request", 403);
    }
    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: Only the assigned caregiver can upload proof", 403);
    }

    if (!req.file) {
      throw new ApiError("No file uploaded", 400);
    }

    let fileType;
    if (req.file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      fileType = "video";
    } else {
      throw new ApiError("Unsupported file format. Only images and videos are allowed.", 400);
    }

    let secureUrl;
    try {
      secureUrl = await uploadToCloudinary(req.file);
    } catch (uploadError) {
      throw new ApiError("Cloudinary upload failed: " + uploadError.message, 500);
    }

    task.proofFiles.push({
      url: secureUrl,
      fileType: fileType,
      uploadDate: new Date()
    });
    task.taskState = "Completed";
    task.completedAt = new Date();
    await task.save();

    await createNotification({
      recipientId: booking.client,
      recipientRole: "client",
      notificationType: "TASK_COMPLETED",
      title: "Task Completed",
      message: "A task has been completed and proof has been uploaded.",
      relatedEntityId: task._id,
      relatedEntityType: "tasks"
    });

    res.status(200).json({
      success: true,
      message: "Proof uploaded successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  const Task = await taskServices.gettasksbyid(req.params.id);
  if (!Task) {
    throw new ApiError("task not found", 404);
  }
  res.status(200).json({
    message: "task retrieved successfully",
    status: "success",
    data: Task
  })
};

exports.updateTask = async (req, res, next) => {
  const updates = { ...req.body };
  if (updates.taskState && updates.taskState.toLowerCase() === "completed") {
    updates.completedAt = new Date();
  }
  const Task = await taskServices.updatetasks(req.params.id, updates);
  res.status(200).json({
    message: "task updated successfully",
    status: "success",
    data: Task
  })
};

exports.deleteTask = async (req, res, next) => {
  const Task = await taskServices.deletetasks(req.params.id);
  res.status(200).json({
    message: "task deleted successfully",
    status: "success",
    data: Task
  })
};
exports.deleteAllTasks = async (req, res, next) => {
  const Task = await taskServices.deleteAllTasks();
  res.status(200).json({
    message: "tasks deleted successfully",
    status: "success",
    data: Task
  })
};

