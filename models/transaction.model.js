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

}, { timestamps: true });

transactionSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'updateOne', 'deleteMany', 'deleteOne'], function() {
  this.setQuery(this.model.translateAliases(this.getQuery()));
});

module.exports = mongoose.model("Transaction", transactionSchema);