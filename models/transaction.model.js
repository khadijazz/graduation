const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userlog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog",
    required: true,
  },

  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
  },

  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },

  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  type: {
    type: String,
    enum: ["DEPOSIT", "BOOKING_PAYMENT", "REFUND"],
    required: true,
  },

  paymentMethod: {
    type: String,
    enum: ["CARD", "MOBILE_WALLET", "INTERNAL_WALLET"],
    required: true,
  },

  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED"],
    default: "PENDING",
  },

  paymobOrderId: String,
  paymobTransactionId: String,

}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);