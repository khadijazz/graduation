const mongoose = require('mongoose');

  const requestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },

  location: String,
  date: Date,
  time: String,
  duration: String,
  notes: String,

  status: {
    type: String,
    enum: [
      "PENDING",
      "BOOKED",
      "COMPLETED",
      "CANCELLED"
    ],
    default: "PENDING",
  },

}, { timestamps: true });

const Request = mongoose.model("request", requestSchema);
module.exports = Request;

