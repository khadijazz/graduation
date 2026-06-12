const jwt = require("jsonwebtoken");
const Userlog = require("../models/userlog.model");
const CaregiverModel = require("../models/caregiver.model");
const adminModel = require("../models/admin.model");
const { ApiError } = require("../Utills/ApiError");

module.exports = async (req, res, next) => {
  const bearerToken = req.headers["authorization"];

  if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
    throw new ApiError("you are not logged in", 401);
  }

  const token = bearerToken.split(" ")[1];

  const payload = jwt.verify(token, "this-is-my-very-long-secret-key");

  let user = await Userlog.findById(payload.id);

  if (!user) {
    user = await CaregiverModel.findById(payload.id);
  }
    if (!user) {
    user = await adminModel.findById(payload.id);
  }

  if (!user) {
    throw new ApiError("user no longer exists", 401);
  }

  if (user.isBlocked) {
    throw new ApiError("Your account has been blocked. Please contact support.", 403);
  }

  if (user.role === "caregiver") {
    if (user.status === "Pending Approval") {
      throw new ApiError("Your account is pending approval.", 403);
    }
    if (user.status === "Declined") {
      throw new ApiError("Your caregiver application has been declined.", 403);
    }
  }

  req.user = user;
  next();
};