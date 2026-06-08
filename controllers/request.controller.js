const requestModel = require("../models/request.model");
const requestService = require("../services/request.services");
const { ApiError } = require("../Utills/ApiError");

exports.createRequest = async (req, res, next) => {
  if (!req.user.governorate) {
    throw new ApiError("Client account does not have a governorate assigned. Please update your profile.", 400);
  }

  const request = await requestService.createRequestService({
    ...req.body,
    client: req.user._id,
    governorate: req.user.governorate, // Store authenticated client's governorate
  });

  res.status(201).json({
    success: true,
    message: "Request created successfully",
    data: request,
  });
};

exports.getMyRequests = async (req, res, next) => {
    const requests = await requestService.getmyrequests(req.user._id);
    res.status(200).json({
        message: "Requests fetched successfully",
        data: requests,
    });
};

exports.respondToRequest = async (req, res, next) => {
     const { requestId } = req.params;
     const { action } = req.body; 
     const request = await requestModel.findById(requestId);

     if (!request) {
       return res.status(404).json({ message: "Request not found" });
     }

     if (request.caregiver.toString() !== req.user._id.toString()) {
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


