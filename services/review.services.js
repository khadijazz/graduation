const Review = require("../models/review.model");
const Booking = require("../models/booking.model");
const Caregiver = require("../models/caregiver.model");
const Userlog = require("../models/userlog.model");
const { ApiError } = require("../Utills/ApiError");
const { createNotification } = require("./notification.services");

exports.createReviewService = async (req) => {
  const { bookingId } = req.params;

  const {
    overallRating,
    professionalismRating,
    serviceQualityRating,
    punctualityRating,
    communicationRating,
    reviewComment,
  } = req.body;

  if (!bookingId) {
    throw new ApiError("Booking ID is required", 400);
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  const isClient =
    booking.client.toString() === req.user._id.toString();

  const isCaregiver =
    booking.caregiver.toString() === req.user._id.toString();

  if (!isClient && !isCaregiver) {
    throw new ApiError(
      "Unauthorized to review this booking",
      403
    );
  }

  if (booking.bookingStatus !== "COMPLETED") {
    throw new ApiError(
      "Reviews can only be submitted for completed bookings",
      400
    );
  }

  const existing = await Review.findOne({
    booking: bookingId,
    reviewer: req.user._id,
  });

  if (existing) {
    throw new ApiError(
      "You already reviewed this booking",
      400
    );
  }

  const ratings = [
    overallRating,
    professionalismRating,
    serviceQualityRating,
    punctualityRating,
    communicationRating,
  ];

  for (const r of ratings) {
    if (
      r === undefined ||
      r === null ||
      isNaN(Number(r)) ||
      Number(r) < 1 ||
      Number(r) > 5
    ) {
      throw new ApiError(
        "All ratings must be numbers between 1 and 5",
        400
      );
    }
  }

  let reviewerModel;
  let reviewee;
  let revieweeModel;

  if (isClient) {
    reviewerModel = "Userlog";
    reviewee = booking.caregiver;
    revieweeModel = "Caregiver";
  } else {
    reviewerModel = "Caregiver";
    reviewee = booking.client;
    revieweeModel = "Userlog";
  }

  const review = await Review.create({
    booking: bookingId,

    reviewer: req.user._id,
    reviewerModel,

    reviewee,
    revieweeModel,

    overallRating: Number(overallRating),
    professionalismRating: Number(
      professionalismRating
    ),
    serviceQualityRating: Number(
      serviceQualityRating
    ),
    punctualityRating: Number(
      punctualityRating
    ),
    communicationRating: Number(
      communicationRating
    ),

    reviewComment: reviewComment || "",
  });

  const reviews = await Review.find({
    reviewee,
  });

  const totalReviewsCount = reviews.length;

  const sumRatings = reviews.reduce(
    (sum, review) => sum + review.overallRating,
    0
  );

  const averageRating =
    totalReviewsCount > 0
      ? sumRatings / totalReviewsCount
      : 0;

  if (revieweeModel === "Caregiver") {
    await Caregiver.findByIdAndUpdate(reviewee, {
      averageRating: parseFloat(
        averageRating.toFixed(2)
      ),
      totalReviewsCount,
    });
  } else {
    await Userlog.findByIdAndUpdate(reviewee, {
      averageRating: parseFloat(
        averageRating.toFixed(2)
      ),
      totalReviewsCount,
    });
  }

  await createNotification({
    recipientId: reviewee,
    recipientRole:
      revieweeModel === "Caregiver"
        ? "caregiver"
        : "client",

    notificationType: "REVIEW_SUBMITTED",

    title: "New Review",

    message: isClient
      ? "You have received a new review from a client."
      : "You have received a new review from a caregiver.",

    relatedEntityId: review._id,
    relatedEntityType: "Review",
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



