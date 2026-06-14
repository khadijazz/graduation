const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userlog: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "ownerModel",
    required: true,
    alias: "user"
  },
  ownerModel: {
    type: String,
    required: true,
    enum: ["Userlog", "Caregiver"],
    default: "Userlog"
  },

  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
  },

  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog",
  },

  caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Caregiver",
  },

  serviceName: {
    type: String,
  },

  isSettled: {
    type: Boolean,
    default: false,
  },

  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  paymentMethod: {
    type: String,
    enum: "CARD",
    default: "CARD",
    required: true,
  },

  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED"],
    default: "PENDING",
  },

  paymobOrderId: String,
  paymobTransactionId: String,

  type: {
    type: String,
  },

  description: {
    type: String,
  },

  bundleUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientBundle",
  },

  discountAmount: {
    type: Number,
    default: 0,
  },

  finalChargedAmount: {
    type: Number,
  },

  originalAmount: {
    type: Number,
  },

}, { timestamps: true });

transactionSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'updateOne', 'deleteMany', 'deleteOne'], function() {
  this.setQuery(this.model.translateAliases(this.getQuery()));
});

module.exports = mongoose.model("Transaction", transactionSchema);