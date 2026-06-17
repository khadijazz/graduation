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

    // 2. Mark the held transactions as settled
    await Transaction.updateMany(
      {
        booking: booking._id,
        type: { $in: ["BOOKING_PAYMENT", "EXTRA_TASK_PAYMENT"] },
        status: "COMPLETED"
      },
      { isSettled: true },
      { session }
    );

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
        $or: [
          { createdBy: { $ne: "caregiver" } },
          { createdBy: "caregiver", taskState: "Approved" }
        ]
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

    if (task.createdBy === "caregiver" && (task.taskState === "Pending Client Approval" || task.taskState === "Rejected")) {
      throw new ApiError("Proof cannot be uploaded for a task that is not approved", 400);
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
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      throw new ApiError("task not found", 404);
    }

    const updates = { ...req.body };
    if (updates.taskState && updates.taskState.toLowerCase() === "completed") {
      if (task.createdBy === "caregiver" && (task.taskState === "Pending Client Approval" || task.taskState === "Rejected")) {
        throw new ApiError("Only approved tasks can be completed", 400);
      }
      updates.completedAt = new Date();
    }

    const updatedTask = await taskServices.updatetasks(req.params.id, updates);
    res.status(200).json({
      message: "task updated successfully",
      status: "success",
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
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

exports.addExtraTask = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { title, price, description } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ApiError("Task Title is required", 400);
    }
    if (price === undefined || typeof price !== "number" || price <= 0) {
      throw new ApiError("Task Price must be a positive number", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Security: Only assigned caregiver can add tasks
    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: Only assigned caregiver can add tasks", 403);
    }

    // Edge Case: Caregiver adds task after booking completion
    if (booking.bookingStatus === "COMPLETED") {
      throw new ApiError("Cannot add tasks after booking has been completed", 400);
    }
    if (booking.bookingStatus === "CANCELLED") {
      throw new ApiError("Cannot add tasks to a cancelled booking", 400);
    }

    // Edge Case: Duplicate task creation
    const existingTask = await Task.findOne({
      request: booking.request,
      $or: [
        { title: title.trim() },
        { taskDescription: title.trim() }
      ]
    });
    if (existingTask) {
      throw new ApiError("A task with this title already exists for this booking", 400);
    }

    const task = new Task({
      request: booking.request,
      booking: booking._id,
      taskDescription: title.trim(),
      title: title.trim(),
      price,
      description: description ? description.trim() : undefined,
      createdBy: "caregiver",
      taskState: "Pending Client Approval"
    });

    await task.save();

    // Notify client
    await createNotification({
      recipientId: booking.client,
      recipientRole: "client",
      notificationType: "EXTRA_TASK_REQUESTED",
      title: "Additional task requested",
      message: "A caregiver has requested approval for an additional task.",
      relatedEntityId: task._id,
      relatedEntityType: "tasks"
    });

    res.status(201).json({
      success: true,
      message: "Extra task added successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.approveExtraTask = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const task = await Task.findById(req.params.id).session(session);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }
    if (task.createdBy !== "caregiver") {
      throw new ApiError("Only caregiver-added tasks require approval", 400);
    }

    // Prevent duplicate approvals / rejections
    if (task.taskState === "Approved" || task.taskState === "Completed") {
      throw new ApiError("Task is already approved", 400);
    }
    if (task.taskState === "Rejected") {
      throw new ApiError("Task is already rejected", 400);
    }

    const booking = await Booking.findById(task.booking).session(session);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Edge Case: Booking cancelled/completed before approval
    if (booking.bookingStatus === "CANCELLED") {
      throw new ApiError("Booking has been cancelled", 400);
    }
    if (booking.bookingStatus === "COMPLETED") {
      throw new ApiError("Booking is already completed", 400);
    }

    // Security: Only booking owner can approve or reject tasks
    if (booking.client.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: Only booking owner can approve tasks", 403);
    }

    // Wallet balance check and deduction
    const wallet = await Wallet.findOne({ userlog: booking.client }).session(session);
    if (!wallet) {
      throw new ApiError("Client wallet not found", 404);
    }
    if (wallet.balance < task.price) {
      throw new ApiError("Insufficient wallet balance", 400);
    }

    // Deduct and move to Hold Balance
    wallet.balance -= task.price;
    wallet.holdBalance = (wallet.holdBalance || 0) + task.price;
    wallet.totalSpent = (wallet.totalSpent || 0) + task.price;
    wallet.lastTransactionAt = new Date();

    const transaction = new Transaction({
      userlog: booking.client,
      wallet: wallet._id,
      booking: booking._id,
      amount: task.price,
      type: "EXTRA_TASK_PAYMENT",
      status: "COMPLETED",
      paymentMethod: "CARD",
    });
    await transaction.save({ session });
    wallet.transactions.push(transaction._id);
    await wallet.save({ session });

    // Increase booking total amount
    booking.price = (booking.price || 0) + task.price;
    if (booking.finalPrice !== undefined) {
      booking.finalPrice = (booking.finalPrice || 0) + task.price;
    }
    await booking.save({ session });

    // Approve the task
    task.taskState = "Approved";
    await task.save({ session });

    // Notify Caregiver
    await createNotification({
      recipientId: booking.caregiver,
      recipientRole: "caregiver",
      notificationType: "EXTRA_TASK_APPROVED",
      title: "Additional task approved",
      message: "Additional task approved successfully.",
      relatedEntityId: task._id,
      relatedEntityType: "tasks"
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Additional task approved successfully",
      data: task
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.rejectExtraTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }
    if (task.createdBy !== "caregiver") {
      throw new ApiError("Only caregiver-added tasks require rejection", 400);
    }

    // Prevent duplicate approvals / rejections
    if (task.taskState === "Approved" || task.taskState === "Completed") {
      throw new ApiError("Task is already approved", 400);
    }
    if (task.taskState === "Rejected") {
      throw new ApiError("Task is already rejected", 400);
    }

    const booking = await Booking.findById(task.booking);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    // Security: Only booking owner can approve or reject tasks
    if (booking.client.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: Only booking owner can reject tasks", 403);
    }

    // Reject the task
    task.taskState = "Rejected";
    await task.save();

    // Notify Caregiver
    await createNotification({
      recipientId: booking.caregiver,
      recipientRole: "caregiver",
      notificationType: "EXTRA_TASK_REJECTED",
      title: "Additional task rejected",
      message: "Additional task was rejected by the client.",
      relatedEntityId: task._id,
      relatedEntityType: "tasks"
    });

    res.status(200).json({
      success: true,
      message: "Additional task rejected successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

