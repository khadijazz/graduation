const request = require("../models/request.model");
////
exports.createRequest = async (req, res, next) => {
    const {client,caregiver,service,location,date,time,duration,notes,status,propsed_price} = req.body;
    const request = await request.create({client,caregiver,service,location,date,time,duration,notes,status,propsed_price});
    res.status(201).json({
        message: "Request created successfully",
        data: request,
    });
};

exports.getAllRequests = async (req, res, next) => {
    const requests = await Request.find()
      .populate("client", "name phone")
      .populate("caregiver", "name phone")
      .populate("service", "serviceType");

    res.status(200).json({
      data: requests,
    });
};

exports.getMyRequests = async (req, res, next) => {
    const requests = await Request.find({ client: req.user._id })
      .populate("service", "serviceType")
      .populate("caregiver", "name phone");

    res.status(200).json({
      data: requests,
    });
  
};


exports.respondToRequest = async (req, res, next) => {
    const { requestId } = req.params;
    const { action } = req.body; 
    const request = await Request.findById(requestId);

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
