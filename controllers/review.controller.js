const reviewService = require("../services/review.services");
const { ApiError } = require("../Utills/ApiError");
const Review = require("../models/review.model");
const Caregiver = require("../models/caregiver.model");

exports.createReview = async (req, res, next) => {
    const review = await reviewService.createReviewService(req);
    res.status(201).json({
        status: "success",
        message: "Review created successfully",
        data: {
            review
        },
    });
};

exports.getCaregiverReviews = async (req, res, next) => {
    const result = await reviewService.getCaregiverReviewsService(req);
    res.status(200).json({
        status: "success",
        data: result,
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
    const reviews = await reviewService.adminGetReviewsService(req);
    res.status(200).json({
        status: "success",
        length: reviews.length,
        data: {
            reviews
        },
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

    if (req.user.role !== "client" || review.client.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized to update this review", 403);
    }

    const {
        overallRating,
        professionalismRating,
        serviceQualityRating,
        punctualityRating,
        communicationRating,
        reviewComment
    } = req.body;

    const updates = {};
    if (overallRating !== undefined) updates.overallRating = Number(overallRating);
    if (professionalismRating !== undefined) updates.professionalismRating = Number(professionalismRating);
    if (serviceQualityRating !== undefined) updates.serviceQualityRating = Number(serviceQualityRating);
    if (punctualityRating !== undefined) updates.punctualityRating = Number(punctualityRating);
    if (communicationRating !== undefined) updates.communicationRating = Number(communicationRating);
    if (reviewComment !== undefined) updates.reviewComment = reviewComment;

    for (const key of ['overallRating', 'professionalismRating', 'serviceQualityRating', 'punctualityRating', 'communicationRating']) {
        if (updates[key] !== undefined && (isNaN(updates[key]) || updates[key] < 1 || updates[key] > 5)) {
            throw new ApiError("All ratings must be numbers between 1 and 5", 400);
        }
    }

    const updatedReview = await Review.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    );

    if (overallRating !== undefined) {
        const caregiverReviews = await Review.find({ caregiver: review.caregiver });
        const totalReviewsCount = caregiverReviews.length;
        const sumRatings = caregiverReviews.reduce((sum, r) => sum + r.overallRating, 0);
        const averageRating = sumRatings / totalReviewsCount;

        await Caregiver.findByIdAndUpdate(review.caregiver, {
            averageRating: parseFloat(averageRating.toFixed(2)),
            totalReviewsCount
        });
    }

    res.status(200).json({
        status: "success",
        message: "Review updated successfully",
        data: {
            review: updatedReview
        },
    });
};

exports.deleteReview = async (req, res, next) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        throw new ApiError("Review not found", 404);
    }

    if (req.user.role !== "client" || review.client.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized to delete this review", 403);
    }

    await Review.findByIdAndDelete(req.params.id);

    const caregiverReviews = await Review.find({ caregiver: review.caregiver });
    const totalReviewsCount = caregiverReviews.length;
    let averageRating = 0;
    if (totalReviewsCount > 0) {
        const sumRatings = caregiverReviews.reduce((sum, r) => sum + r.overallRating, 0);
        averageRating = sumRatings / totalReviewsCount;
    }

    await Caregiver.findByIdAndUpdate(review.caregiver, {
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviewsCount
    });

    res.status(200).json({
        status: "success",
        message: "Review deleted successfully",
        data: null,
    });
};
