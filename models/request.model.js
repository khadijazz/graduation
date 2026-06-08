const mongoose = require('mongoose');

  const requestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog",
  
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  
  },
   caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "caregiver",

  },
  governorate: {
    type: String,
    required: [true, "Governorate is required"],
  },
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

const Request = mongoose.model("Request", requestSchema);
module.exports = Request;

