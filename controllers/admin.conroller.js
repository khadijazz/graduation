const {ApiError}=require("../Utills/ApiError");
const adminServices=require("../services/admin.services");


exports.createadmin = async (req,res,next)=>{

  const userData = req.body;
  const admin = await adminServices.createadmin(userData);

  res.status(201).json({
    status: "success",
    data: admin
  });
};


exports.deleteadmin = async (req, res, next) => {

  const user = await adminServices.deleteadmin(
    req.user._id
  );

  res.status(200).json({
    status: "success",
    message: "Account deleted successfully",
    data: null
  });
};

exports.getPendingCaregivers = async (req, res) => {
  const caregivers = await adminServices.getPendingCaregiversService();
  res.status(200).json({
    status: "success",
    length: caregivers.length,
    data: {
      caregivers
    }
  });
};

exports.getCaregiverDetails = async (req, res) => {
  const caregiver = await adminServices.getCaregiverDetailsService(req.params.id);
  res.status(200).json({
    status: "success",
    data: {
      caregiver
    }
  });
};

exports.approveCaregiver = async (req, res) => {
  const caregiver = await adminServices.verifyCaregiver(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Caregiver approved successfully",
    data: {
      caregiver
    }
  });
};

exports.rejectCaregiver = async (req, res) => {
  const { reason } = req.body;
  const caregiver = await adminServices.rejectCaregiver(req.params.id, reason);
  res.status(200).json({
    status: "success",
    message: "Caregiver application declined successfully",
    data: {
      caregiver
    }
  });
};

exports.getComplaints = async (req, res) => {
  const complaints = await adminServices.getComplaintsService();

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
    length: formattedComplaints.length,
    data: {
      complaints: formattedComplaints
    }
  });
};

exports.getComplaintById = async (req, res) => {
  const complaint = await adminServices.getComplaintByIdService(req.params.id);

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

  const formattedComplaint = {
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

  res.status(200).json({
    status: "success",
    data: {
      complaint: formattedComplaint
    }
  });
};

exports.updateComplaintStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw new ApiError("Status is required", 400);
  }
  const complaint = await adminServices.updateComplaintStatusService(req.params.id, status);
  res.status(200).json({
    status: "success",
    message: "Complaint status updated successfully",
    data: {
      complaint
    }
  });
};

exports.blockUser = async (req, res) => {
  const { reason } = req.body;
  const adminId = req.user._id;
  const { account, type } = await adminServices.blockUserService(req.params.id, reason, adminId);
  res.status(200).json({
    status: "success",
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} account blocked successfully`,
    data: {
      account
    }
  });
};

exports.unblockUser = async (req, res) => {
  const { account, type } = await adminServices.unblockUserService(req.params.id);
  res.status(200).json({
    status: "success",
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} account unblocked successfully`,
    data: {
      account
    }
  });
};

exports.getDashboardStats = async (req, res) => {
  const stats = await adminServices.getDashboardStatsService();
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      totalUsers: stats.totalUsers,
      totalProviders: stats.totalProviders,
      activeBookings: stats.activeBookings
    }
  });
};