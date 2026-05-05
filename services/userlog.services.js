const Userlog = require("../models/userlog.model");
const jwt =require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const crypto = require("crypto"); 
const {ApiError}=require("../Utills/ApiError");
const sendEmail = require("../Utills/email");


const createUserLog=(data)=>Userlog.create(data);

const loginUser=async (data)=>{
const userDoc=await Userlog.findOne({email:data.email});
if(!userDoc){
    throw new ApiError("no user found with this email",400);
}
const hashedSaltedPassword=userDoc.password;
const password=data.password;
const isTheOne=await bcrypt.compare(password,hashedSaltedPassword);
if(!isTheOne){
    throw new ApiError("email or password is wrong",400);
}
return jwt.sign({id:userDoc._id,role: userDoc.role},"this-is-my-very-long-secret-key")
}

const getUserById=(id)=>Userlog.findById(id);
//forget pass
const forgotPassword = async (data, protocol, host) => {
  // STEP 1 ── Find user by posted email
  const user = await Userlog.findOne({ email: data.email });
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
  const user = await Userlog.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
 
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
 

module.exports ={
    createUserLog,
    loginUser,
    getUserById,
    resetPassword,
    forgotPassword
}