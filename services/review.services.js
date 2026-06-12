const Review = require("../models/review.model");
const Booking = require("../models/booking.model");
const Caregiver = require("../models/caregiver.model");
const { ApiError } = require("../Utills/ApiError");

exports.createReviewService = async (req) => {
 const { bookingId } = req.params;
    const {
        overallRating,
        professionalismRating,
        serviceQualityRating,
        punctualityRating,
        communicationRating,
        reviewComment
    } = req.body;

    if (!bookingId) {
        throw new ApiError("Booking ID is required", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError("Booking not found", 404);
    }

    // Verify booking belongs to authenticated client
    if (booking.client.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized to review this booking", 403);
    }

    // Verify booking status is completed
    if (booking.bookingStatus !== "COMPLETED") {
        throw new ApiError("Reviews can only be submitted for completed bookings", 400);
    }

    // Verify no review exists for this booking
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
        throw new ApiError("A review already exists for this booking", 400);
    }

    // Verify ratings are between 1 and 5
    const ratings = [overallRating, professionalismRating, serviceQualityRating, punctualityRating, communicationRating];
    for (const r of ratings) {
        if (r === undefined || r === null || isNaN(Number(r)) || Number(r) < 1 || Number(r) > 5) {
            throw new ApiError("All ratings must be numbers between 1 and 5", 400);
        }
    }

    // Create review
    const review = await Review.create({
        booking: bookingId,
        client: req.user._id,
        caregiver: booking.caregiver,
        overallRating: Number(overallRating),
        professionalismRating: Number(professionalismRating),
        serviceQualityRating: Number(serviceQualityRating),
        punctualityRating: Number(punctualityRating),
        communicationRating: Number(communicationRating),
        reviewComment: reviewComment || ""
    });

    // Recalculate caregiver rating statistics
    const caregiverReviews = await Review.find({ caregiver: booking.caregiver });
    const totalReviewsCount = caregiverReviews.length;
    const sumRatings = caregiverReviews.reduce((sum, r) => sum + r.overallRating, 0);
    const averageRating = sumRatings / totalReviewsCount;

    await Caregiver.findByIdAndUpdate(booking.caregiver, {
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviewsCount
    });

    return review;
};

exports.getCaregiverReviewsService = async (req) => {
    const { caregiverId } = req.params;

    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) {
        throw new ApiError("Caregiver not found", 404);
    }

    const reviews = await Review.find({ caregiver: caregiverId })
        .populate("client", "full_name profile_picture");

    // Calculate rating breakdown
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
        const rating = Math.round(r.overallRating);
        if (ratingBreakdown[rating] !== undefined) {
            ratingBreakdown[rating]++;
        }
    });

    return {
        reviews,
        averageRating: caregiver.averageRating || 0,
        totalReviewsCount: caregiver.totalReviewsCount || 0,
        ratingBreakdown
    };
};

exports.adminGetReviewsService = async (req) => {
    const { caregiver, client, rating, startDate, endDate } = req.query;

    const filter = {};
    if (caregiver) filter.caregiver = caregiver;
    if (client) filter.client = client;
    if (rating) filter.overallRating = Number(rating);

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const reviews = await Review.find(filter)
        .populate("client", "full_name email")
        .populate("caregiver", "full_name email")
        .populate("booking", "_id bookingStatus price")
        .sort({ createdAt: -1 });

    return reviews;
};



