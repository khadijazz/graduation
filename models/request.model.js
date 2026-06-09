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
    ref: "Caregiver",

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
      "CANCELLED",
      "ACCEPTED",
      "REJECTED",
    ],
    default: "PENDING",
    
  },
budget: {
  type: Number,
  required: [true, "Budget is required"],
},
}, { timestamps: true });

const Request = mongoose.model("Request", requestSchema);
module.exports = Request;

