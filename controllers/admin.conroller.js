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
  res.status(200).json({
    status: "success",
    length: complaints.length,
    data: {
      complaints
    }
  });
};

exports.getComplaintById = async (req, res) => {
  const complaint = await adminServices.getComplaintByIdService(req.params.id);
  res.status(200).json({
    status: "success",
    data: {
      complaint
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