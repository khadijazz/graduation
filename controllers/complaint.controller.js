const Complaint = require("../models/complaint.model");
const { ApiError } = require("../Utills/ApiError");

const Booking = require("../models/booking.model");

exports.createComplaint = async (req, res) => {
  const { bookingId } = req.params;
  const { subject, message, complaint_category } = req.body;

  if (!subject || !message) {
    throw new ApiError("Subject and message are required", 400);
  }

  const booking = await Booking.findById(bookingId)
    .populate("client", "full_name email")
    .populate("caregiver", "full_name email");

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  const complaint = await Complaint.create({
    user: req.user._id,
    booking: booking._id,
    subject,
    message,
    complaint_category,
  });

  res.status(201).json({
    status: "success",
    message: "Complaint submitted successfully",
    data: {
      complaintId: complaint._id,

      client: {
        id: booking.client._id,
        name: booking.client.full_name,
        email: booking.client.email,
      },

      caregiver: {
        id: booking.caregiver._id,
        name: booking.caregiver.full_name,
        email: booking.caregiver.email,
      },

      subject: complaint.subject,
      message: complaint.message,
      status: complaint.status,
      complaint_category: complaint.complaint_category,
      createdAt: complaint.createdAt,
    },
  });
};

exports.getComplaintDetails = async (req, res) => {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId)
    .populate({
      path: "booking",
      populate: [
        {
          path: "client",
          select: "full_name email"
        },
        {
          path: "caregiver",
          select: "full_name email"
        }
      ]
    });

  if (!complaint) {
    throw new ApiError("Complaint not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      complaintId: complaint._id,

      client: {
        id: complaint.booking.client._id,
        name: complaint.booking.client.full_name,
        email: complaint.booking.client.email
      },

      caregiver: {
        id: complaint.booking.caregiver._id,
        name: complaint.booking.caregiver.full_name,
        email: complaint.booking.caregiver.email
      },

      subject: complaint.subject,
      message: complaint.message,
      status: complaint.status,
      complaint_category: complaint.complaint_category,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt
    }
  });
};

exports.getAllComplaints = async (req, res) => {
  const complaints = await Complaint.find()
    .populate({
      path: "booking",
      populate: [
        {
          path: "client",
          select: "full_name email"
        },
        {
          path: "caregiver",
          select: "full_name email"
        }
      ]
    });

  res.status(200).json({
    status: "success",
    data: {
      complaints
    }
  });
};