const taskServices = require("../services/task.services");
const { ApiError } = require("../Utills/ApiError");

exports.createTasks = async (req, res, next) => {
  try {
    const RequestModel = require("../models/request.model");
    const request = await RequestModel.findById(req.params.id);
    if (!request) {
      throw new ApiError("Request not found", 404);
    }
    if (request.client.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: You do not own this request", 403);
    }

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
  } catch (error) {
    next(error);
  }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    const Booking = require("../models/booking.model");
    const RequestModel = require("../models/request.model");

    let requestIds = [];

    if (req.user.role === "caregiver") {
      const bookings = await Booking.find({ caregiver: req.user._id });
      requestIds = bookings.map(b => b.request.toString());
    } else if (req.user.role === "client") {
      const requests = await RequestModel.find({ client: req.user._id });
      requestIds = requests.map(r => r._id.toString());
    }

    // Filter by allowable requests
    if (req.query.request) {
      if (!requestIds.includes(req.query.request.toString())) {
        return res.status(200).json({
          message: "tasks retrieved successfully",
          status: "success",
          data: []
        });
      }
    } else {
      req.query.request = { $in: requestIds };
    }

    const Task = await taskServices.getalltasks(req.query);
    res.status(200).json({
      message: "tasks retrieved successfully",
      status: "success",
      data: Task
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const Task = await taskServices.gettasksbyid(req.params.id);
    if (!Task) {
      throw new ApiError("task not found", 404);
    }

    const Booking = require("../models/booking.model");
    const booking = await Booking.findOne({ request: Task.request });
    if (!booking) {
      throw new ApiError("No booking associated with this task's request", 404);
    }

    const isClient = booking.client.toString() === req.user._id.toString();
    const isCaregiver = booking.caregiver.toString() === req.user._id.toString();
    if (!isClient && !isCaregiver) {
      throw new ApiError("Unauthorized to view this task", 403);
    }

    res.status(200).json({
      message: "task retrieved successfully",
      status: "success",
      data: Task
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const TaskModel = require("../models/tasks.model");
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const Booking = require("../models/booking.model");
    const booking = await Booking.findOne({ request: task.request });
    if (!booking) {
      throw new ApiError("No booking associated with this task", 404);
    }

    const isClient = booking.client.toString() === req.user._id.toString();
    const isCaregiver = booking.caregiver.toString() === req.user._id.toString();
    if (!isClient && !isCaregiver) {
      throw new ApiError("Unauthorized to update this task", 403);
    }

    if (req.body.taskState === "completed" && req.user.role === "caregiver") {
      if (!task.proofs || task.proofs.length === 0) {
        throw new ApiError("Cannot mark task as completed without uploading proof first", 400);
      }
      req.body.completedAt = new Date();
    }

    const Task = await taskServices.updatetasks(taskId, req.body);
    res.status(200).json({
      message: "task updated successfully",
      status: "success",
      data: Task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const TaskModel = require("../models/tasks.model");
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const Booking = require("../models/booking.model");
    const booking = await Booking.findOne({ request: task.request });
    if (booking) {
      const isClient = booking.client.toString() === req.user._id.toString();
      const isCaregiver = booking.caregiver.toString() === req.user._id.toString();
      if (!isClient && !isCaregiver) {
        throw new ApiError("Unauthorized to delete this task", 403);
      }
    }

    const Task = await taskServices.deletetasks(taskId);
    res.status(200).json({
      message: "task deleted successfully",
      status: "success",
      data: Task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAllTasks = async (req, res, next) => {
  try {
    const Task = await taskServices.deleteAllTasks();
    res.status(200).json({
      message: "tasks deleted successfully",
      status: "success",
      data: Task
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadTaskProof = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    if (!req.file) {
      throw new ApiError("No file uploaded. Please upload a file with field name 'proof'.", 400);
    }

    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      throw new ApiError("Invalid file type. Only images and videos are allowed.", 400);
    }

    const TaskModel = require("../models/tasks.model");
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const Booking = require("../models/booking.model");
    const booking = await Booking.findOne({ request: task.request });
    if (!booking) {
      throw new ApiError("No booking associated with this task", 404);
    }

    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: You are not the caregiver for this booking", 403);
    }

    if (booking.bookingStatus !== "IN_PROGRESS") {
      throw new ApiError("Cannot upload proof for a booking that is not in progress", 400);
    }

    const { uploadToCloudinary } = require("../Utills/uploadCloudinary");
    let secureUrl;
    try {
      secureUrl = await uploadToCloudinary(req.file);
    } catch (err) {
      throw new ApiError("Cloudinary upload failed: " + err.message, 500);
    }

    if (!task.proofs) {
      task.proofs = [];
    }

    const proofEntry = {
      url: secureUrl,
      mediaType: isVideo ? "video" : "image",
      uploadedAt: new Date()
    };

    task.proofs.push(proofEntry);
    task.proofUrl = secureUrl;
    task.proofType = isVideo ? "video" : "image";

    await task.save();

    res.status(200).json({
      message: "Proof uploaded successfully",
      status: "success",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const TaskModel = require("../models/tasks.model");
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const Booking = require("../models/booking.model");
    const booking = await Booking.findOne({ request: task.request });
    if (!booking) {
      throw new ApiError("No booking associated with this task", 404);
    }

    if (booking.caregiver.toString() !== req.user._id.toString()) {
      throw new ApiError("Unauthorized: You are not the caregiver for this booking", 403);
    }

    if (booking.bookingStatus !== "IN_PROGRESS") {
      throw new ApiError("Cannot complete task for a booking that is not in progress", 400);
    }

    if (!task.proofs || task.proofs.length === 0) {
      throw new ApiError("Cannot mark task as completed without uploading proof first", 400);
    }

    task.taskState = "completed";
    task.completedAt = new Date();
    await task.save();

    res.status(200).json({
      message: "Task completed successfully",
      status: "success",
      data: task
    });
  } catch (error) {
    next(error);
  }
};
