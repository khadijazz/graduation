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
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    ],
    default: "PENDING"
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
  checkInTime: Date,
  checkOutTime: Date,
  isTrackingActive: {
    type: Boolean,
    default: false,
  },
  paymentReleased: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Pre-save middleware to handle isTrackingActive status transitions
bookingSchema.pre("save", function () {
  if (this.isModified("bookingStatus")) {
    this.isTrackingActive = (this.bookingStatus === "IN_PROGRESS");
  }
});

// Pre-findOneAndUpdate middleware to handle isTrackingActive status transitions
bookingSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update) {
    if (update.bookingStatus !== undefined) {
      update.isTrackingActive = (update.bookingStatus === "IN_PROGRESS");
    }
    if (update.$set && update.$set.bookingStatus !== undefined) {
      update.$set.isTrackingActive = (update.$set.bookingStatus === "IN_PROGRESS");
    }
  }
});

module.exports = mongoose.model("Booking", bookingSchema);

