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

const getallrequests = (queryParams) => {
  const apiFeature = new ApiFeature(
    requestModel.find({}),
    queryParams
  );

  apiFeature.paginate();
  apiFeature.sort();
  apiFeature.projection();

  return apiFeature.dbQuery;
};

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

const getOffers = async (requestId, userId) => {
  const request = await requestModel.findById(requestId);

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  if (request.client.toString() !== userId.toString()) {
    throw new ApiError("Unauthorized", 403);
  }

  return await offerModel
    .find({ request: requestId })
    .populate("caregiver", "name rating experience")
    .sort({ createdAt: -1 });
};

module.exports = {
  createRequestService,
  getmyrequests,
  getAvailableRequests,
  getallrequests,
  getrequestbyid,
  updaterequest,
  deleterequest,
  getOffers,
};