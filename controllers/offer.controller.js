
const offerService = require("../services/offer.services");
const requestService = require("../services/request.services");
const {ApiFeature}=require("../Utills/ApiFeature.js");


exports.getMyRequests = async (req, res, next) => {
    const requests = await requestService.getmyrequests(req.user);
    res.status(200).json({
      data: requests,
    });
};



exports.createOffer = async (req, res) => {
  const offer = await offerService.createOfferService(req.user, {
    requestId: req.params.requestId,
    ...req.body 
  });

  res.status(201).json({
    message: "Offer sent",
    data: offer,
  });
};

  exports.deleteOffer = async (req, res, next) => {
  const {offerId}=req.params;
const offer = await offerService.deleteOfferService(offerId, req.user._id);
  res.status(200).json({
    message: "offer deleted successfully",
    success: true,
  });
};

exports.getOffers = async (req, res, next) => {
  const {requestId}=req.params;
  const userId=req.user._id;

  const offers=await offerService.getOffers(requestId,userId);
  res.status(200).json({
    status:"success",
    offerCount: offers.length,
    message:"Offers fetched successfully",
    data:offers,
  })
};
exports.respondToOffer = async (req, res) => {
  const offer = await offerService.respondToOffer(req.params.offerId,req.user._id,req.body.status);
  res.status(200).json({
    message: "Response saved",
    data: offer,
  });
};