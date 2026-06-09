const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog",
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
    enum: ["PENDING", "RESOLVED"],
    default: "PENDING",
  },
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
