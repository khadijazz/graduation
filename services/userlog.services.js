const Userlog = require("../models/userlog.model");
const CaregiverModel=require("../models/caregiver.model");
const jwt =require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const crypto = require("crypto"); 
const {ApiError}=require("../Utills/ApiError");
const sendEmail = require("../Utills/email");
const wallet=require("../models/wallet.model");


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

  await Wallet.create({
    user: user._id,
    balance: 0,
    totalDeposited: 0,
    totalSpent: 0
  });

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
let wallet = await Wallet.findOne({
  user: userDoc._id
});

if (!wallet) {

  await Wallet.create({
    user: userDoc._id,
    balance: 0,
    totalDeposited: 0,
    totalSpent: 0
  });
}

return jwt.sign(
  {
    id: userDoc._id,
    role: userDoc.role || userType
  },
  "this-is-my-very-long-secret-key"
);
}

const getUserById=(id)=>Userlog.findById(id);
//forget pass
const forgotPassword = async (data, protocol, host) => {
  // STEP 1 ── Find user by posted email
  let user = await Userlog.findOne({ email: data.email });
 if (!user) {
  user = await CaregiverModel.findOne({ email: data.email });
}
  if (!user) {
    throw new ApiError("There is no user with that email address", 404);
  }
 
  // STEP 2 ── Generate random reset token (instance method on model)
  const resetToken = user.createPasswordResetToken();
 
  // Save hashed token + expiry to DB, skip validators (password field etc.)
  await user.save({ validateBeforeSave: false });
 
  // STEP 3 ── Build reset URL and send email
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
    // Email failed → wipe token fields so the user can request again
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
 
// ─────────────────────────────────────────────────────────────────────────────
//  RESET PASSWORD SERVICE
//  Called by resetPassword controller
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (plainToken, newPassword, passwordConfirmation) => {
  // STEP 1 ── Hash the plain URL token to compare with the stored hashed one
  const hashedToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");
 
  // Find user whose token matches AND hasn't expired yet
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
 
  // Guard: max 3 attempts per token
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
 
  // Increment attempt counter before touching the password
  user.passwordResetAttempts += 1;
  await user.save({ validateBeforeSave: false });
 
  // STEP 2 ── Set the new password (pre-save hook will hash it)
  user.password = newPassword;
  user.passwordConfirmation = passwordConfirmation;
 
  // Clear all reset fields — token is now consumed
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
 
  // Full save → runs validators (passwordConfirmation match) + hashing hook
  await user.save();
 
  // STEP 3 ── Issue a fresh JWT so the user is immediately logged in
  const token = jwt.sign(
    { id: user._id, role: user.role },
    "this-is-my-very-long-secret-key"
  );
 
  return token;
};
 //change password
 const updatePassword = async (userId, currentPassword, newPassword, passwordConfirmation) => {
  // STEP 1 — جيب الـ user من الـ DB مع الـ password
  // (الـ password عنده select:false في بعض الـ schemas — هنا بنجبره صراحةً)
  let user = await Userlog.findById(userId).select("+password");
  if (!user) {
  user = await CaregiverModel.findById(userId).select("+password");
}
  if (!user) throw new ApiError("User not found", 404);
 
  // STEP 2 — تحقق إن الـ current password صح
  const isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) throw new ApiError("Your current password is wrong", 401);
 
  // STEP 3 — حدّث الـ password
  // بنستخدم save() مش findByIdAndUpdate() عشان الـ pre-save hook يشتغل ويعمل hash
  user.password = newPassword;
  user.passwordConfirmation = passwordConfirmation;
  await user.save();
 
  // STEP 4 — ابعت JWT جديد (الـ user مسجل دخول تلقائياً)
  return jwt.sign({ id: user._id, role: user.role }, "this-is-my-very-long-secret-key");
};


module.exports ={
    createUserLog,
    updatePassword,
    loginUser,
    getUserById,
    resetPassword,
    forgotPassword
}