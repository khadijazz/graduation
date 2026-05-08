const requestModel = require("../models/request.model");
const offerModel = require("../models/offer.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const { ApiError } = require("../Utills/ApiError");

const createRequestService = (data) =>
  requestModel.create(data);

const getmyrequests = (userId) =>
  requestModel
    .find({ client: userId })
    .populate("client", "name phone")
    .populate("service", "serviceType");

const getAvailableRequests = () =>
  requestModel
    .find({ status: "PENDING" })
    .populate("client", "_id name phone")
    .populate("service", "serviceType")
    .sort({ createdAt: -1 });

const getrequestbyid = async (id) => {
  const request = await requestModel
    .findById(id)
    .populate("client", "name phone")
    .populate("service", "serviceType");

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