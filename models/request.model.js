const mongoose = require('mongoose');

  const requestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  
  },
   caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "caregiver",

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

