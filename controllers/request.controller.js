const requestModel = require("../models/request.model");
const requestService = require("../services/request.services");

exports.createRequest = async (req, res, next) => {
  const request = await requestService.createRequestService({
    ...req.body,
    client: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Request created successfully",
    data: request,
  });
};


exports.getMyRequests = async (req, res, next) => {
    const requests = await requestService.getmyrequests();
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
    const request = await request.findById(req.params.id);
    res.status(200).json({
        message: "Request fetched successfully",
        data: request,
    });
};

exports.updateRequest = async (req, res, next) => {
    const request = await request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
        message: "Request updated successfully",
        data: request,
    });
};


exports.deleterequest = async (req, res, next) => {
    const request = await request.findByIdAndDelete(req.params.id);
    res.status(200).json({
        message: "Request deleted successfully",
        data: request,
    });
};

exports.getAvailableRequests = async (req, res) => {

  const requests = await requestService.getAvailableRequests();

  res.status(200).json({
    success: true,
    results: requests.length,
    data: requests
  });
};

exports.getallrequests = async (req, res, next) => {
    const requests = await requestService.getallrequests();
    res.status(200).json({
        message: "Requests fetched successfully",
        data: requests,
    });
};
 exports.getoffers = async (req, res, next) => {
     const offers = await requestService.getoffers();
     res.status(200).json({
         message: "Offers fetched successfully",
         data: offers,
     });
 };