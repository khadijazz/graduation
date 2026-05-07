const offerModel = require("../models/offer.model");
const requestModel = require("../models/request.model");
const { ApiFeature } = require("../Utills/ApiFeature");

const createOfferService = async (req, res, next) => {
  const { requestId, price, notes } = data;

  const request = await requestModel.findById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
  throw new Error("Request unavailable");
}

  return await offerModel.create({
    request: requestId,
    caregiver: user._id,
    price,
    notes,
  });
};

const deleteOfferService=async (req, res, next) => {
  const {offerId}=req.params;
  const offer=await offerModel.findById(offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }
  if (offer.caregiver.toString() !== req.user._id.toString()) {
    throw new Error("Unauthorized");
  }
  await offer.deleteOne();
};

exports.createOfferService = {createOfferService};
