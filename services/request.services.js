
const requestModel = require("../models/request.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const offerModel = require("../models/offer.model");


const createRequestService = async (req, res, next) => {
    const {client,caregiver,service,location,date,time,duration,notes,status,propsed_price} = req.body;
    const request = await requestModel.create({client,caregiver,service,location,date,time,duration,notes,status,propsed_price});
    
};

const getmyrequests=async(req,res,next) => {
    const requests = await requestModel.find({ client: req.user._id })
     .populate("client", "name phone")
      .populate("caregiver", "name phone")
      .populate("service", "serviceType");

};


const getOffers = async (requestId, userId) => {
  const request = await requestModel.findById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.client.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  
  const offers = await offerModel.find({ request: requestId })
    .populate("caregiver", "name rating experience")
    .sort({ createdAt: -1 });

  return offers;
};