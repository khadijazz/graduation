const requestModel = require("../models/request.model");
const offerModel = require("../models/offer.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const { ApiError } = require("../Utills/ApiError");

const createRequestService = (data) =>
  requestModel.create(data);

const getmyrequests = (userId) =>
  requestModel
    .find({ client: userId })
    .populate("client", "full_name phone")
    .populate("service", "serviceName");

const getAvailableRequests = async (governorate) => {
  const requests = await requestModel
    .find({
      status: "PENDING",
      governorate: governorate,
      date: { $gte: new Date() }
    })
    .populate({
      path: "client",
      select: "_id full_name email active name phone",
      match: { active: { $ne: false } }
    })
    .populate("service", "serviceType")
    .sort({ createdAt: -1 });

  return requests.filter(req => req.client !== null);
};

const getrequestbyid = async (id) => {
  const request = await requestModel
    .findById(id)
    .populate("client", " full_name phone")
    .populate("service", "serviceName");

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  return request;
};

const updaterequest = (id, updates) =>
  requestModel.findByIdAndUpdate(
    id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

const deleterequest = (id) =>
  requestModel.findByIdAndDelete(id);



module.exports = {
  createRequestService,
  getmyrequests,
  getAvailableRequests,
  getrequestbyid,
  updaterequest,
  deleterequest,

};