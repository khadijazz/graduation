const Complaint = require("../models/complaint.model");
const { ApiError } = require("../Utills/ApiError");

const Booking = require("../models/booking.model");

exports.createComplaint = async (req, res) => {
  const { bookingId } = req.params;
   console.log("BODY:", req.body);
  const { subject, message, complaint_category } = req.body;

  if (!subject || !message || !complaint_category) {
    throw new ApiError("Subject and message and complaint category are required", 400);
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
    .populate("user", "full_name email")
    .populate({
      path: "booking",
      populate: [
        { path: "client", select: "full_name email" },
        { path: "caregiver", select: "full_name email" }
      ]
    });

  if (!complaint) {
    throw new ApiError("Complaint not found", 404);
  }

  const client = (complaint.booking && complaint.booking.client)
    ? {
        id: complaint.booking.client._id,
        full_name: complaint.booking.client.full_name,
        name: complaint.booking.client.full_name,
        email: complaint.booking.client.email
      }
    : (complaint.user
      ? {
          id: complaint.user._id,
          full_name: complaint.user.full_name,
          name: complaint.user.full_name,
          email: complaint.user.email
        }
      : null);

  const caregiver = (complaint.booking && complaint.booking.caregiver)
    ? {
        id: complaint.booking.caregiver._id,
        full_name: complaint.booking.caregiver.full_name,
        name: complaint.booking.caregiver.full_name,
        email: complaint.booking.caregiver.email
      }
    : null;

  const booking = complaint.booking
    ? {
        id: complaint.booking._id
      }
    : null;

  res.status(200).json({
    status: "success",
    data: {
      complaintId: complaint._id,
      subject: complaint.subject,
      message: complaint.message,
      complaint_category: complaint.complaint_category,
      status: complaint.status,
      createdAt: complaint.createdAt,
      client,
      caregiver,
      booking,
      user: {
        id: complaint.user?._id || (complaint.booking && complaint.booking.client?._id) || null,
        name: complaint.user?.full_name || (complaint.booking && complaint.booking.client?.full_name) || null,
        email: complaint.user?.email || (complaint.booking && complaint.booking.client?.email) || null
      }
    }
  });
};




exports.getAllComplaints = async (req, res) => {
  const complaints = await Complaint.find()
    .populate("user", "full_name email")
    .populate({
      path: "booking",
      populate: [
        { path: "client", select: "full_name email" },
        { path: "caregiver", select: "full_name email" }
      ]
    });

  const formattedComplaints = complaints.map(complaint => {
    const client = (complaint.booking && complaint.booking.client)
      ? {
          id: complaint.booking.client._id,
          full_name: complaint.booking.client.full_name,
          name: complaint.booking.client.full_name,
          email: complaint.booking.client.email
        }
      : (complaint.user
        ? {
            id: complaint.user._id,
            full_name: complaint.user.full_name,
            name: complaint.user.full_name,
            email: complaint.user.email
          }
        : null);

    const caregiver = (complaint.booking && complaint.booking.caregiver)
      ? {
          id: complaint.booking.caregiver._id,
          full_name: complaint.booking.caregiver.full_name,
          name: complaint.booking.caregiver.full_name,
          email: complaint.booking.caregiver.email
        }
      : null;

    const booking = complaint.booking
      ? {
          id: complaint.booking._id
        }
      : null;

    return {
      complaintId: complaint._id,
      subject: complaint.subject,
      message: complaint.message,
      complaint_category: complaint.complaint_category,
      status: complaint.status,
      createdAt: complaint.createdAt,
      client,
      caregiver,
      booking,
      user: {
        id: complaint.user?._id || (complaint.booking && complaint.booking.client?._id) || null,
        name: complaint.user?.full_name || (complaint.booking && complaint.booking.client?.full_name) || null,
        email: complaint.user?.email || (complaint.booking && complaint.booking.client?.email) || null
      }
    };
  });

  res.status(200).json({
    status: "success",
    data: {
      complaints: formattedComplaints
    }
  });
};