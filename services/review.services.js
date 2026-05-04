const Review = require("../models/review.model");
const ApiError = require("../Utills/apierrors");
const Request = require("../models/request.model");
const Caregiver = require("../models/caregiver.model");
const Client = require("../models/client.model");

exports.createReviewService = async (req, res, next) => {
    const { requestId, rate, feedback } = req.body;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (req.user.role !== "CLIENT" && req.user.role !== "CAREGIVER") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (request.status !== "COMPLETED") {
      return res.status(400).json({ message: "Request not completed yet" });
    }

    let reviewData = {};

    if (req.user.role === "CLIENT") {
      if (request.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not your request" });
      }

      reviewData = {
        client: req.user._id,
        caregiver: request.caregiver,
        request: request._id,
        rate,
        feedback,
      };

    } else {
      if (request.caregiver.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not your request" });
      }

      reviewData = {
        client: request.client,
        caregiver: req.user._id,
        request: request._id,
        rate,
        feedback,
      };
    }

    let existing;

if (req.user.role === "CLIENT") {
  existing = await Review.findOne({
    request: requestId,
    client: req.user._id,
  });
} else {
  existing = await Review.findOne({
    request: requestId,
    caregiver: req.user._id,
  });
}

    if (existing) {
      return res.status(400).json({ message: "Already reviewed" });
    }

    const review = await Review.create(reviewData);

    res.status(201).json({
      message: "Review created",
      data: review,
    });
}

exports.getCaregiverReviewsService = async (req, res, next) => {
    const { caregiverId } = req.params;

    const reviews = await Review.find({ caregiver: caregiverId })
      .populate("client", "name")
     

    res.status(200).json({
      data: reviews,
    });
 
};

exports.getMyReviewsService = async (req, res, next) => {
    const reviews = await Review.find({ client: req.user._id })
      .populate("caregiver", "name")
      

    res.status(200).json({
      data: reviews,
    });
 
};



