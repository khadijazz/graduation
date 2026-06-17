const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog",
    required: true,
  },
    booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Open", "In Review", "Resolved", "Closed", "PENDING", "RESOLVED"],
    default: "Open",
  },
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
