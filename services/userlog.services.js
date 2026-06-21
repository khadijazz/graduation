const Userlog = require("../models/userlog.model");
const CaregiverModel = require("../models/caregiver.model");
const adminModel = require("../models/admin.model");
const Request = require("../models/request.model");
const Offer = require("../models/offer.model");
const Booking = require("../models/booking.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const Notification = require("../models/notification.model");
const Review = require("../models/review.model");
const Complaint = require("../models/complaint.model");
const ClientBundle = require("../models/clientbundel.model");
const CaregiverLocation = require("../models/caregiverLocation.model");
const { ChatSession, Message } = require("../models/Chat.model");
const Task = require("../models/tasks.model");
const mongoose = require("mongoose");
const { createNotification } = require("./notification.services");
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

  let wallet = await Wallet.findOne({ userlog: user._id, ownerModel: "Userlog" });
  let walletCreated = false;

  if (!wallet) {
    wallet = new Wallet({
      userlog: user._id,
      ownerModel: "Userlog",
      balance: 0,
      holdBalance: 0,
      totalSpent: 0,
      transactions: []
    });
    await wallet.save();
    walletCreated = true;
  }

  try {
    user.wallet = wallet._id;
    await user.save();
  } catch (err) {
    if (walletCreated) {
      await Wallet.findByIdAndDelete(wallet._id);
    }
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
  if (!userDoc) {
    userDoc = await adminModel.findOne({ email: data.email }).select("+password");
    userType = "admin";
  }
if(!userDoc){
    throw new ApiError("no user found with this email",400);
}

if (userDoc.isBlocked) {
    throw new ApiError("Your account has been blocked. Please contact support.", 403);
}

if (userType === "caregiver") {
    if (userDoc.status === "Pending Approval") {
        throw new ApiError("Your account is pending approval.", 403);
    }
    if (userDoc.status === "Declined") {
        throw new ApiError("Your caregiver application has been declined.", 403);
    }
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

const forgotPassword = async (data) => {
  let user = await Userlog.findOne({ email: data.email });

  if (!user) {
    user = await CaregiverModel.findOne({ email: data.email });
  }

  if (!user) {
    throw new ApiError("There is no user with that email address", 404);
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `https://graduation-production-b4c1.up.railway.app/userlog/reset-password/${resetToken}`;

  const message = `
Hello,

We received a request to reset your password.

Click the link below to reset your password:

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
 

const getAllUsers = async () => {
    const users = await Userlog.aggregate([
        {
            $match: {
                role: "client"
            }
        },
        {
            $lookup: {
                from: "booking",
                localField: "_id",
                foreignField: "client",
                as: "booking"
            }
        },
        {
            $project: {
                full_name: 1,
                email: 1,
                createdAt: 1,
                isBlocked:1,  
                bookingsCount: { $size: "$booking" }
            }
        }
    ]);

    return users;
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
const deleteAccount = async (userId, role) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Send the notification first (before deletion)
    await createNotification({
      recipientId: userId,
      recipientRole: role,
      notificationType: "ACCOUNT_DELETION_REQUEST",
      title: "Account Deletion Request",
      message: "Account deletion request received."
    });

    // 2. Perform validations
    // Active bookings check
    // Active status: PENDING, ACCEPTED, CONFIRMED, IN_PROGRESS
    const activeBookingQuery = {
      bookingStatus: { $in: ["PENDING", "ACCEPTED", "CONFIRMED", "IN_PROGRESS"] }
    };
    if (role === "client") {
      activeBookingQuery.client = userId;
    } else {
      activeBookingQuery.caregiver = userId;
    }

    const activeBooking = await Booking.findOne(activeBookingQuery).session(session);
    if (activeBooking) {
      throw new ApiError("Cannot delete account while active bookings exist.", 400);
    }

    // Wallet check
    const wallet = await Wallet.findOne({ userlog: userId, ownerModel: role === "client" ? "Userlog" : "Caregiver" }).session(session);
    if (wallet) {
      if (wallet.balance > 0 || wallet.holdBalance > 0) {
        throw new ApiError("Please withdraw or spend your wallet balance before deleting your account.", 400);
      }
    }

    // 3. Delete related data
    if (role === "client") {
      // CLIENT CLEANUP
      // Delete Client Bundle records
      await ClientBundle.deleteMany({ client: userId }).session(session);

      // Find requests to clean up tasks/offers/bookings
      const requests = await Request.find({ client: userId }).session(session);
      const requestIds = requests.map(r => r._id);

      // Delete tasks linked to client requests
      await Task.deleteMany({ request: { $in: requestIds } }).session(session);

      // Delete offers linked to client requests
      await Offer.deleteMany({ request: { $in: requestIds } }).session(session);

      // Delete bookings linked to client requests or client
      await Booking.deleteMany({
        $or: [
          { request: { $in: requestIds } },
          { client: userId }
        ]
      }).session(session);

      // Delete requests
      await Request.deleteMany({ client: userId }).session(session);

      // Delete reviews created by client
      await Review.deleteMany({ reviewer: userId, reviewerModel: "Userlog" }).session(session);

      // Delete complaints created by client
      await Complaint.deleteMany({ user: userId }).session(session);

      // Delete notifications
      await Notification.deleteMany({ recipientId: userId }).session(session);

      // Delete AI assistant data
      const chatSessions = await ChatSession.find({ user: userId }).session(session);
      const chatSessionIds = chatSessions.map(c => c._id);
      await Message.deleteMany({ session: { $in: chatSessionIds } }).session(session);
      await ChatSession.deleteMany({ user: userId }).session(session);

      // Delete Transactions
      await Transaction.deleteMany({
        $or: [
          { userlog: userId, ownerModel: "Userlog" },
          { client: userId }
        ]
      }).session(session);
      if (wallet) {
        await Transaction.deleteMany({ wallet: wallet._id }).session(session);
      }

      // Delete Wallet
      await Wallet.deleteMany({ userlog: userId, ownerModel: "Userlog" }).session(session);

      // Delete User account
      const user = await Userlog.findByIdAndDelete(userId).session(session);
      if (!user) {
        throw new ApiError("User not found", 404);
      }

    } else if (role === "caregiver") {
      // CAREGIVER CLEANUP
      // Delete Caregiver Location records
      await CaregiverLocation.deleteMany({ caregiver: userId }).session(session);

      // Delete offers submitted by caregiver
      await Offer.deleteMany({ caregiver: userId }).session(session);

      // Delete reviews received by caregiver
      await Review.deleteMany({ reviewee: userId, revieweeModel: "Caregiver" }).session(session);

      // Delete complaints related to caregiver
      const caregiverBookings = await Booking.find({ caregiver: userId }).session(session);
      const caregiverBookingIds = caregiverBookings.map(b => b._id);
      await Complaint.deleteMany({ booking: { $in: caregiverBookingIds } }).session(session);

      // Delete bookings caregiver was involved in
      await Booking.deleteMany({ caregiver: userId }).session(session);

      // Delete notifications
      await Notification.deleteMany({ recipientId: userId }).session(session);

      // Delete AI assistant data
      const chatSessions = await ChatSession.find({ user: userId }).session(session);
      const chatSessionIds = chatSessions.map(c => c._id);
      await Message.deleteMany({ session: { $in: chatSessionIds } }).session(session);
      await ChatSession.deleteMany({ user: userId }).session(session);

      // Delete Transactions
      await Transaction.deleteMany({
        $or: [
          { userlog: userId, ownerModel: "Caregiver" },
          { caregiver: userId }
        ]
      }).session(session);
      if (wallet) {
        await Transaction.deleteMany({ wallet: wallet._id }).session(session);
      }

      // Delete Wallet
      await Wallet.deleteMany({ userlog: userId, ownerModel: "Caregiver" }).session(session);

      // Delete Caregiver account
      const cg = await CaregiverModel.findByIdAndDelete(userId).session(session);
      if (!cg) {
        throw new ApiError("Caregiver not found", 404);
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Audit log
    console.log("Account permanently deleted.");
    return { success: true };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteUserLog = async (userId) => {
  return deleteAccount(userId, "client");
};


module.exports ={
    createUserLog,
    getAllUsers,
    updatePassword,
    loginUser,
    getUserById,
    resetPassword,
    forgotPassword,
    deleteUserLog,
    deleteAccount
}