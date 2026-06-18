const mongoose = require("mongoose");

const caregiverLocationSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    unique: true
  },
  caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Caregiver",
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("CaregiverLocation", caregiverLocationSchema);

