const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Caregiver = require("../models/caregiver.model");
const Complaint = require("../models/complaint.model");
const Request = require("../models/request.model");
const Userlog = require("../models/userlog.model");
const sendEmail = require("../Utills/email");
const { ApiError } = require("../Utills/ApiError");

const createadmin = async (data) => {
  const { name, email, password, passwordConfirmation,level ,role ,address} = data;

  const admin = await Admin.create({
    name,
    email,
    password,
    passwordConfirmation,
    level,
    role,
    address
  });

  return admin;
};


const updateadmin = async (id, data) => {
  return Admin.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteadmin = async (id) => {
  return Admin.findByIdAndDelete(id);
};

const deleteAllAdmins = async () => {
  return Admin.deleteMany({});
};


const getPendingCaregiversService = async () => {
  return await Caregiver.find({
    status: "Pending Approval"
  }).select("+verifcation_documents");
};

const getCaregiverDetailsService = async (caregiverId) => {
  const caregiver = await Caregiver.findById(caregiverId).select("+verifcation_documents");
  if (!caregiver) {
    throw new ApiError("Caregiver not found", 404);
  }
  return caregiver;
};

const verifyCaregiver = async (caregiverId) => {
  const caregiver = await Caregiver.findById(caregiverId);
  if (!caregiver)
    throw new ApiError("Caregiver not found", 404);

  caregiver.status = "Verified";
  await caregiver.save();

  try {
    await sendEmail({
      email: caregiver.email,
      subject: "Caregiver Account Approved",
      message: `Hello ${caregiver.full_name},\n\nWe are pleased to inform you that your caregiver account has been approved!\n\nYour account is now active, and you can log in and start using the platform.\n\nBest regards,\nEhtmam Team`
    });
  } catch (err) {
    console.error("Email notification failed for caregiver approval:", err);
  }

  return caregiver;
};

const rejectCaregiver = async (caregiverId, reason) => {
  const caregiver = await Caregiver.findById(caregiverId);
  if (!caregiver)
    throw new ApiError("Caregiver not found", 404);

  caregiver.status = "Declined";
  await caregiver.save();

  const rejectionReasonMsg = reason ? `Reason for rejection: ${reason}` : "";
  const message = `Hello ${caregiver.full_name},\n\nWe regret to inform you that your caregiver application has been declined.\n\n${rejectionReasonMsg}\n\nIf you have any questions or would like to submit additional documents, please contact support.\n\nBest regards,\nEhtmam Team`;

  try {
    await sendEmail({
      email: caregiver.email,
      subject: "Caregiver Application Status Update",
      message
    });
  } catch (err) {
    console.error("Email notification failed for caregiver rejection:", err);
  }

  return caregiver;
};


const getComplaintsService = async () => {
  return await Complaint.find()
    .populate("user", "full_name email")
    .sort({ createdAt: -1 });
};

const getComplaintByIdService = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId).populate("user", "full_name email");
  if (!complaint) {
    throw new ApiError("Complaint not found", 404);
  }
  return complaint;
};

const updateComplaintStatusService = async (complaintId, status) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError("Complaint not found", 404);
  }
  complaint.status = status;
  await complaint.save();
  return complaint;
};

const blockUserService = async (userId, reason, adminId) => {
  let account = await Userlog.findById(userId);
  let type = "client";
  if (!account) {
    account = await Caregiver.findById(userId);
    type = "caregiver";
  }
  if (!account) {
    throw new ApiError("Account not found", 404);
  }
  account.isBlocked = true;
  account.blockReason = reason || "No reason provided";
  account.blockDate = new Date();
  account.blockedBy = adminId;
  await account.save();
  return { account, type };
};

const unblockUserService = async (userId) => {
  let account = await Userlog.findById(userId);
  let type = "client";
  if (!account) {
    account = await Caregiver.findById(userId);
    type = "caregiver";
  }
  if (!account) {
    throw new ApiError("Account not found", 404);
  }
  account.isBlocked = false;
  account.blockReason = null;
  account.blockDate = null;
  account.blockedBy = null;
  await account.save();
  return { account, type };
};

module.exports = {
  createadmin,
  updateadmin,
  deleteadmin,
  deleteAllAdmins,
  getPendingCaregiversService,
  getCaregiverDetailsService,
  verifyCaregiver,
  rejectCaregiver,
  getComplaintsService,
  getComplaintByIdService,
  updateComplaintStatusService,
  blockUserService,
  unblockUserService,
};