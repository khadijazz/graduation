const Userlog = require("../models/userlog.model");
const CaregiverModel=require("../models/caregiver.model");
const Request = require("../models/request.model");
const Offer = require("../models/offer.model");
const Booking = require("../models/booking.model");
const Wallet = require("../models/wallet.model");
const jwt =require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const crypto = require("crypto"); 
const {ApiError}=require("../Utills/ApiError");
const sendEmail = require("../Utills/email");



const createUserLog = async (data) => {

  const existingUser = await Userlog.findOne({
    email: data.email
  });

  const existingCaregiver = await CaregiverModel.findOne({
    email: data.email
  });

  if (existingUser || existingCaregiver) {
    throw new ApiError("Email already exists", 400);
  }

  const user = await Userlog.create(data);

  try {
    await Wallet.create({
      userlog: user._id,
      ownerModel: "Userlog",
      balance: 0,
      holdBalance: 0
    });
  } catch (err) {
    await Userlog.findByIdAndDelete(user._id);
    throw err;
  }

  return user;
};
 

const loginUser=async (data)=>{
let userDoc=await Userlog.findOne({email:data.email}).select("+password");
 let userType = "user";

  if (!userDoc) {
    userDoc = await CaregiverModel.findOne({ email: data.email }).select("+password");
    userType = "caregiver";
  }
if(!userDoc){
    throw new ApiError("no user found with this email",400);
}
const hashedSaltedPassword=userDoc.password;
const password=data.password;
const isTheOne=await bcrypt.compare(password,hashedSaltedPassword);
if(!isTheOne){
    throw new ApiError("email or password is wrong",400);
}

const token = jwt.sign(
  {
    id: userDoc._id,
    role: userDoc.role || userType
  },
  "this-is-my-very-long-secret-key"
);

userDoc.password = undefined;

return {
  user: userDoc,
  token
};
}

const getUserById=(id)=>Userlog.findById(id);

const forgotPassword = async (data, protocol, host) => {
  
  let user = await Userlog.findOne({ email: data.email });
 if (!user) {
  user = await CaregiverModel.findOne({ email: data.email });
}
  if (!user) {
    throw new ApiError("There is no user with that email address", 404);
  }
 
  
  const resetToken = user.createPasswordResetToken();
 
  
  await user.save({ validateBeforeSave: false });
 
  
  const resetURL = `${protocol}://${host}/userlog/reset-password/${resetToken}`;
 
  const message =
    `Hello,

We received a request to reset your password.

Reset your password using this link:
${resetURL}

This link is valid for 10 minutes.

If you did not request this, please ignore this email.
`;
 
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset link (valid for 10 min)",
      message,
    });
  } catch (err) {
    
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = undefined;
    await user.save({ validateBeforeSave: false });
 
    throw new ApiError(
      "There was an error sending the email. Please try again later.",
      500
    );
  }
};
 




const resetPassword = async (plainToken, newPassword, passwordConfirmation) => {
  
  const hashedToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");
 
  
  let user = await Userlog.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
 if (!user) {
  user = await CaregiverModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
 }
  if (!user) {
    throw new ApiError("Token is invalid or has expired. Please request a new one.", 400);
  }
 
  
  if (user.passwordResetAttempts >= 3) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    await user.save({ validateBeforeSave: false });
 
    throw new ApiError(
      "Too many attempts. Please request a new password reset link.",
      429
    );
  }
 
  
  user.passwordResetAttempts += 1;
  await user.save({ validateBeforeSave: false });
 
  
  user.password = newPassword;
  user.passwordConfirmation = passwordConfirmation;
 
  
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
 
  
  await user.save();
 
  
  const token = jwt.sign(
    { id: user._id, role: user.role },
    "this-is-my-very-long-secret-key"
  );
 
  return token;
};
 
 const updatePassword = async (userId, currentPassword, newPassword, passwordConfirmation) => {
  
  
  let user = await Userlog.findById(userId).select("+password");
  if (!user) {
  user = await CaregiverModel.findById(userId).select("+password");
}
  if (!user) throw new ApiError("User not found", 404);
 
  
  const isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) throw new ApiError("Your current password is wrong", 401);
 
  
  
  user.password = newPassword;
  user.passwordConfirmation = passwordConfirmation;
  await user.save();
 
  
  return jwt.sign({ id: user._id, role: user.role }, "this-is-my-very-long-secret-key");
};
const deleteUserLog = async (userId) => {

  const requests = await Request.find({
    client: userId
  });

  const requestIds = requests.map(r => r._id);

  await Offer.deleteMany({
    request: { $in: requestIds }
  });

  await Booking.deleteMany({
    client: userId
  });

  await Request.deleteMany({
    client: userId
  });

  await Wallet.deleteOne({
    userlog: userId
  });

  const user = await Userlog.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return user;
};


module.exports ={
    createUserLog,
    updatePassword,
    loginUser,
    getUserById,
    resetPassword,
    forgotPassword,
    deleteUserLog
}