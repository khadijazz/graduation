const reviewService = require("../services/review.services");
const { ApiError } = require("../error/ApiError");
const Review = require("../models/review.model");
const requestController = require("../controllers/request.controller");
const { requestModel } = require("../models/request.model");
const caregiverModel = require("../models/caregiver.model");
const clientModel = require("../models/client.model");


exports.createReview = async (req, res, next) => {
    const reivew = await reviewService.createReviewService(req, res, next);
    res.status(201).json({
        message: "Review created successfully",
        data: reivew,
    });
};

exports.getCaregiverReviews = async (req, res, next) => {
    const { caregiverId } = req.params;

    const reviews = await Review.find({ caregiver: caregiverId })
      .populate("client", "name")
     
    res.status(200).json({
      data: reviews,
    });
 
};

exports.getMyReviews = async (req, res, next) => {
    const reviews = await Review.find({ client: req.user._id })
      .populate("caregiver", "name")
      

    res.status(200).json({
      data: reviews,
    });
 
};
////
