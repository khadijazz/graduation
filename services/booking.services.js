const Booking = require("../models/booking.model");
const Request = require("../models/request.model");
const Offer = require("../models/offer.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const { ApiError } = require("../Utills/ApiError");
const mongoose = require("mongoose");



const getallbooking = (queryParams) => {
  const apiFeature = new ApiFeature(Booking.find({}), queryParams);
  apiFeature.paginate();
  apiFeature.sort();
  apiFeature.projection();
  return apiFeature.dbQuery;
};
const getbookingbyid = (id) => Booking.findById(id);
const updatebooking = (id, updates) => Booking.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deletebooking = (id) => Booking.findByIdAndDelete(id);

const confirmBookingAndPay = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) throw new Error("Booking not found");

  if (booking.client.toString() !== userId.toString())
    throw new Error("Unauthorized");

  const wallet = await Wallet.findOne({ user: userId });

  if (wallet.balance < booking.price)
    throw new Error("Insufficient balance");

  wallet.balance -= booking.price;
  await wallet.save();

  booking.bookingStatus = "CONFIRMED";
  await booking.save();

  return booking;
};

const processPaymentAndConfirmBooking = async (offerId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {


    const offer = await Offer.findById(offerId).populate("request").session(session);
    if (!offer) {
      throw new ApiError("Offer not found", 404);
    }

    const request = offer.request;
    if (!request) {
      throw new ApiError("Request associated with this offer not found", 404);
    }


    if (request.client.toString() !== userId.toString()) {
      throw new ApiError("Unauthorized: This offer does not belong to your request", 403);
    }


    if (request.status !== "PENDING") {
      throw new ApiError("Request is already booked or processed", 400);
    }


    if (offer.status !== "pending") {
      throw new ApiError("Offer is already processed or inactive", 400);
    }


    const wallet = await Wallet.findOne({ userlog: userId }).session(session);
    if (!wallet) {
      throw new ApiError("Wallet not found for this user", 404);
    }

    if (wallet.balance < offer.price) {
      throw new ApiError("Insufficient wallet balance", 400);
    }



    wallet.balance -= offer.price;

    wallet.holdBalance = (wallet.holdBalance || 0) + offer.price;
    wallet.totalSpent = (wallet.totalSpent || 0) + offer.price;
    wallet.lastTransactionAt = new Date();



    const newBooking = new Booking({
      request: request._id,
      offer: offer._id,
      client: request.client,
      caregiver: offer.caregiver,
      price: offer.price,
      bookingStatus: "ACCEPTED",
    });

    await newBooking.save({ session });


    const transaction = new Transaction({
      userlog: userId,
      wallet: wallet._id,
      booking: newBooking._id,
      amount: offer.price,
      type: "BOOKING_PAYMENT",
      paymentMethod: "INTERNAL_WALLET",
      status: "COMPLETED",
    });

    await transaction.save({ session });


    wallet.transactions.push(transaction._id);
    await wallet.save({ session });



    offer.status = "accepted";
    await offer.save({ session });


    await Offer.updateMany(
      { request: request._id, _id: { $ne: offer._id } },
      { status: "rejected" },
      { session }
    );



    request.status = "ACCEPTED";
    request.caregiver = offer.caregiver;
    await request.save({ session });


    await session.commitTransaction();
    session.endSession();

    return newBooking;
  } catch (error) {

    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  getallbooking,
  getbookingbyid,
  updatebooking,
  deletebooking,
  confirmBookingAndPay,
  processPaymentAndConfirmBooking,
};