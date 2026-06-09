const reviewService = require("../services/review.services");
const { ApiError } = require("../Utills/ApiError");
const Review = require("../models/review.model");

exports.createReview = async (req, res, next) => {
    const review = await reviewService.createReviewService(req, res, next);
    res.status(201).json({
        message: "Review created successfully",
        data: review,
    });
};

exports.getCaregiverReviews = async (req, res, next) => {
    const { caregiverId } = req.params;

    const reviews = await Review.find({ caregiver: caregiverId })
      .populate("client", "full_name");
     
    res.status(200).json({
      status: "success",
      data: reviews,
    });
};

exports.getMyReviews = async (req, res, next) => {
    const reviews = await Review.find({ client: req.user._id })
      .populate("caregiver", "full_name");

    res.status(200).json({
      status: "success",
      data: reviews,
    });
};

exports.getAllReviews = async (req, res, next) => {
    const reviews = await Review.find({})
      .populate("client", "full_name")
      .populate("caregiver", "full_name");
    res.status(200).json({
        status: "success",
        data: reviews,
    });
};

exports.getReviewById = async (req, res, next) => {
    const review = await Review.findById(req.params.id)
      .populate("client", "full_name")
      .populate("caregiver", "full_name");
    if (!review) {
        throw new ApiError("Review not found", 404);
    }
    res.status(200).json({
        status: "success",
        data: review,
    });
};

exports.updateReview = async (req, res, next) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        throw new ApiError("Review not found", 404);
    }

    // Authorization check: only owner can update review
    const userId = req.user._id.toString();
    if (review.client.toString() !== userId && review.caregiver.toString() !== userId) {
        throw new ApiError("Unauthorized to update this review", 403);
    }

    const updatedReview = await Review.findByIdAndUpdate(
        req.params.id,
        { rating: req.body.rating, review: req.body.review, feedback: req.body.feedback },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: "success",
        message: "Review updated successfully",
        data: updatedReview,
    });
};

exports.deleteReview = async (req, res, next) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        throw new ApiError("Review not found", 404);
    }

    // Authorization check: admin or owner can delete review
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && review.client.toString() !== userId && review.caregiver.toString() !== userId) {
        throw new ApiError("Unauthorized to delete this review", 403);
    }

    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({
        status: "success",
        message: "Review deleted successfully",
        data: null,
    });
};
