
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
 
    const offer = await offerService.createOfferService (req.user, req.body);

    res.status(201).json({
      message: "Offer sent",
      data: offer,
    });
  };

  exports.deleteOffer = async (req, res, next) => {
  const {offerId}=req.params;
  const offer=await offerService.deleteOfferService(offerId);
  res.status(200).json({
    message: "offer deleted successfully",
    success: true,
  });
};
