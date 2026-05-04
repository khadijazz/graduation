const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    review: {
        type: String,
        required: true,
    },
    
    feedback: {
        type: String,
        required: true,
    },

} , {timestamps: true})

module.exports = mongoose.model("Review", reviewSchema);
