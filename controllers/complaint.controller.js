const Complaint = require("../models/complaint.model");
const { ApiError } = require("../Utills/ApiError");

exports.createComplaint = async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    throw new ApiError("Subject and message are required", 400);
  }

  const complaint = await Complaint.create({
    user: req.user._id,
    subject,
    message
  });

  res.status(201).json({
    status: "success",
    message: "Complaint submitted successfully",
    data: {
      complaint
    }
  });
};
