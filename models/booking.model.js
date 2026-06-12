const mongoose = require("mongoose");


const bookingSchema = new mongoose.Schema({

  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
  },

  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
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

  price: {
    type: Number,
    required: true,
  },

  bookingStatus: {
    type: String,
    enum: [
      "PENDING",
      "ACCEPTED",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED"
    ],
    default: "PENDING",
  },

  originalPrice: {
    type: Number,
  },

  discountAmount: {
    type: Number,
    default: 0,
  },

  finalPrice: {
    type: Number,
  },

  bundleUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientBundle",
  },

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema)
