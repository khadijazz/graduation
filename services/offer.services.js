const offerModel = require("../models/offer.model");
const requestModel = require("../models/request.model");
const { ApiError } = require("../Utills/ApiError");
const { createNotification } = require("./notification.services");

const createOfferService = async (user,data) => {
  const { requestId, price, notes } = data;

  const request = await requestModel.findById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
  throw new Error("Request unavailable");
}

  const offer = await offerModel.create({
    request: requestId,
    caregiver: user._id,
    price,
    notes,
  });

  await createNotification({
    recipientId: request.client,
    recipientRole: "client",
    notificationType: "NEW_OFFER_RECEIVED",
    title: "New Offer Received",
    message: "You have received a new offer for your request.",
    relatedEntityId: offer._id,
    relatedEntityType: "Offer"
  });

  return offer;
};

const deleteOfferService=async (offerId,userId) => {
  const offer=await offerModel.findById(offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }
  if (offer.caregiver.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }
  await offer.deleteOne();
};
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
    .populate(
      "caregiver",
      "full_name profile_picture speciality experience governorate price"
    )
    .sort({ createdAt: -1 });
};

const respondToOffer = async (offerId, userId, status) => {
  const offer = await offerModel.findById(offerId).populate("request");
  if (!offer) throw new Error("Offer not found");

  if (offer.request.client.toString() !== userId.toString())
    throw new Error("Unauthorized");

  if (status === "accepted") {
    offer.status = "accepted";
  } else if (status === "rejected") {
    offer.status = "rejected";
  } else {
    throw new Error("Invalid action");
  }

  await offer.save();
  return offer;
};


module.exports = {createOfferService,deleteOfferService,getOffers,respondToOffer};
