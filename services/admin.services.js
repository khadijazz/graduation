const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Caregiver = require("../models/caregiver.model");
const Complaint = require("../models/complaint.model");
const Request = require("../models/request.model");



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


const getPendingCaregiversService =
  async () => {

  return await Caregiver.find({
    verificationStatus: "PENDING"
  });

};

const verifyCaregiver = async (caregiverId) => {

  const caregiver = await Caregiver.findById(caregiverId);

  if (!caregiver)
    throw new Error("Caregiver not found");

  caregiver.verificationStatus = "VERIFIED";

  await caregiver.save();

  return caregiver;
};

const rejectCaregiver = async (caregiverId) => {

  const caregiver = await Caregiver.findById(caregiverId);

  if (!caregiver)
    throw new Error("Caregiver not found");

  caregiver.verificationStatus = "REJECTED";

  await caregiver.save();

  return caregiver;
};


const getComplaintsService =
  async () => {

  return await Complaint.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

};


module.exports = {
  createadmin,
  updateadmin,
  deleteadmin,
  deleteAllAdmins,
  getPendingCaregiversService,
  verifyCaregiver,
  rejectCaregiver,
  getComplaintsService,
};