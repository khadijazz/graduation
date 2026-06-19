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
  complaint_category: {
    type: String,
    enum: [
      "Poor service quality",
      "Late arrival",
      "Unprofessional behavior",
      "Ignored instructions",
      "Requested extra payment"
    ],
  },
  status: {
    type: String,
    enum: ["Open", "In Review", "Resolved", "Closed", "PENDING", "RESOLVED"],
    default: "Open",
  },
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
