const requestModel = require("../models/request.model");
const requestService = require("../services/request.services");
const taskServices = require("../services/task.services");
const { ApiError } = require("../Utills/ApiError");

exports.createRequest = async (req, res, next) => {
  try {
    if (!req.user.governorate) {
      throw new ApiError("Client account does not have a governorate assigned. Please update your profile.", 400);
    }

    const { tasks, ...requestData } = req.body;

    // Edge Case: Request without Tasks / Empty tasks array
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      throw new ApiError("Tasks array is required and cannot be empty", 400);
    }

    // Edge Case: Duplicate task creation
    const titles = tasks.map(t => (t.title || t.taskDescription || "").trim());
    const hasDuplicates = titles.some((title, index) => titles.indexOf(title) !== index);
    if (hasDuplicates) {
      throw new ApiError("Duplicate tasks are not allowed in the request", 400);
    }

    let request = await requestService.createRequestService({
      ...requestData,
      client: req.user._id,
      governorate: req.user.governorate, 
    });

    try {
      const tasksData = tasks.map(task => {
        const description = task.title || task.taskDescription;
        // Edge Case: Invalid task data
        if (!description || typeof description !== "string" || !description.trim()) {
          throw new ApiError("Invalid task data: title or taskDescription is required and must be a non-empty string", 400);
        }
        return {
          taskDescription: description.trim(),
          request: request._id,
          taskState: "Pending"
        };
      });

      const createdTasks = await taskServices.createTasks(tasksData);

      res.status(201).json({
        success: true,
        message: "Request and tasks created successfully",
        data: {
          ...request.toObject(),
          tasks: createdTasks
        },
      });
    } catch (err) {
      // Edge Case: Request created successfully but task creation fails
      // Rollback: delete request
      await requestService.deleterequest(request._id);
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
};

exports.getMyRequests = async (req, res, next) => {

  try {

    const requests =
      await requestService.getmyrequests(
        req.user._id
      );

    res.status(200).json({
      message: "Requests fetched successfully",
      data: requests,
    });

  } catch(err) {

    console.log("ERROR =", err);

    res.status(500).json({
      status:"error",
      message: err.message
    });

  }

};
exports.respondToRequest = async (req, res, next) => {
     const { requestId } = req.params;
     const { action } = req.body; 
     const request = await requestModel.findById(requestId);

     if (!request) {
       return res.status(404).json({ message: "Request not found" });
     }

     if (!request.caregiver || request.caregiver.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: "Not authorized" });
     }

     if (action === "ACCEPT") {
       request.status = "ACCEPTED";
     } else {
       request.status = "REJECTED";
   }

     await request.save();

     res.status(200).json({
       message: "Response saved",
       data: request,
     });
 };

exports.getrequestbyid = async (req, res, next) => {
    const request = await requestService.getrequestbyid(req.params.id);
    res.status(200).json({
        message: "Request fetched successfully",
        data: request,
    });
};

exports.updateRequest = async (req, res, next) => {
    const request = await requestService.updaterequest(req.params.id, req.body);
    res.status(200).json({
        message: "Request updated successfully",
        data: request,
    });
};

exports.deleterequest = async (req, res, next) => {
    const request = await requestService.deleterequest(req.params.id);
    res.status(200).json({
        message: "Request deleted successfully",
        data: request,
    });
};

exports.getAvailableRequests = async (req, res, next) => {
  if (!req.user.governorate) {
    throw new ApiError("Caregiver account does not have a governorate assigned. Please update your profile.", 400);
  }

  if (req.user.active === false) {
    throw new ApiError("Your account is suspended", 403);
  }

  const requests = await requestService.getAvailableRequests(req.user.governorate);

  res.status(200).json({
    success: true,
    results: requests.length,
    data: requests
  });
};


