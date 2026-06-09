const Booking = require("../models/booking.model");
const Request=require("../models/request.model");
const Offer=require("../models/offer.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const { ApiError } = require("../Utills/ApiError");
const mongoose = require("mongoose");

  const createBookingFromOffer = async (offerId, userId) => {

  const offer = await Offer.findById(offerId)
    .populate("request");

  if (!offer) {
    throw new Error("Offer not found");
  }


  if (offer.request.client.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  // create booking
  const newBooking = await Booking.create({

    request: offer.request._id,

    offer: offer._id,

    client: offer.request.client,

    caregiver: offer.caregiver,

    price: offer.price,

    bookingStatus: "PENDING",
  });

  // update offer
  offer.status = "ACCEPTED";
  await offer.save();

  // update request
  offer.request.status = "BOOKED";
  await offer.request.save();

  return newBooking;
};

const getallbooking = (queryParams) =>{
    const apiFeature=new ApiFeature(Booking.find({}),queryParams);
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
    // 1. Payment Validation
    // Verify the selected offer exists
    const offer = await Offer.findById(offerId).populate("request").session(session);
    if (!offer) {
      throw new ApiError("Offer not found", 404);
    }

    const request = offer.request;
    if (!request) {
      throw new ApiError("Request associated with this offer not found", 404);
    }

    // Verify the offer belongs to the client's request
    if (request.client.toString() !== userId.toString()) {
      throw new ApiError("Unauthorized: This offer does not belong to your request", 403);
    }

    // Verify the request is still pending
    if (request.status !== "PENDING") {
      throw new ApiError("Request is already booked or processed", 400);
    }

    // Verify the offer is still active
    if (offer.status !== "pending") {
      throw new ApiError("Offer is already processed or inactive", 400);
    }

    // Verify the client's wallet exists and has sufficient balance
    const wallet = await Wallet.findOne({ userlog: userId }).session(session);
    if (!wallet) {
      throw new ApiError("Wallet not found for this user", 404);
    }

    if (wallet.balance < offer.price) {
      throw new ApiError("Insufficient wallet balance", 400);
    }

    // 2. Wallet Processing
    // Deduct the accepted offer amount from client's available balance
    wallet.balance -= offer.price;
    // Move the deducted amount into the client's hold balance
    wallet.holdBalance = (wallet.holdBalance || 0) + offer.price;
    wallet.totalSpent = (wallet.totalSpent || 0) + offer.price;
    wallet.lastTransactionAt = new Date();

    // 3. Booking Management
    // Create the booking record
    const newBooking = new Booking({
      request: request._id,
      offer: offer._id,
      client: request.client,
      caregiver: offer.caregiver,
      price: offer.price,
      bookingStatus: "ACCEPTED",
    });

    await newBooking.save({ session });

    // Record the financial transaction for auditing purposes
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

    // Link transaction to wallet
    wallet.transactions.push(transaction._id);
    await wallet.save({ session });

    // 4. Offer Management
    // Update the selected offer status to accepted
    offer.status = "accepted";
    await offer.save({ session });

    // Automatically update all remaining offers for the same request to rejected
    await Offer.updateMany(
      { request: request._id, _id: { $ne: offer._id } },
      { status: "rejected" },
      { session }
    );

    // 5. Request Management
    // Update request status to indicate that caregiver has been selected
    request.status = "ACCEPTED";
    request.caregiver = offer.caregiver;
    await request.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return newBooking;
  } catch (error) {
    // Abort transaction in case of error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  createBookingFromOffer,
  getallbooking,
  getbookingbyid,
  updatebooking,
  deletebooking,
  confirmBookingAndPay,
  processPaymentAndConfirmBooking,
};