const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Userlog",
        required: true,
    },
    caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Caregiver",
        required: true,
    },
    overallRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    professionalismRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    serviceQualityRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    punctualityRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    communicationRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    reviewComment: {
        type: String,
        default: "",
    },
} , {timestamps: true})

module.exports = mongoose.model("Review", reviewSchema);
