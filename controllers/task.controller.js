const taskServices = require("../services/task.services");
const { ApiError } = require("../Utills/ApiError");
const Booking = require("../models/booking.model");
const Task = require("../models/tasks.model");
const { uploadToCloudinary } = require("../Utills/uploadCloudinary");

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
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError(
        "Unauthorized: Only assigned caregiver can check out",
        403
      );
    }

    if (booking.bookingStatus !== "IN_PROGRESS") {
      throw new ApiError(
        "Booking must be checked in first",
        400
      );
    }

    const checkOutTime = new Date();

    booking.bookingStatus = "COMPLETED";
    booking.checkOutTime = checkOutTime;
    booking.isTrackingActive = false;
    await booking.save();

    await Task.updateMany(
      {
        request: booking.request,
        taskState: { $ne: "Completed" },
      },
      {
        taskState: "Completed",
        checkOutTime,
      }
    );

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
    await task.save();

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
  const Task = await taskServices.updatetasks(req.params.id, req.body);
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

