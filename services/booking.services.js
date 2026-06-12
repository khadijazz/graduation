const Booking = require("../models/booking.model");
const Request = require("../models/request.model");
const Offer = require("../models/offer.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const ClientBundle = require("../models/clientbundel.model");
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

    // Check for active bundle subscription
    const activeBundle = await ClientBundle.findOne({
      client: userId,
      status: "ACTIVE"
    }).populate("bundle").session(session);

    let discountAmount = 0;
    let finalPrice = offer.price;
    let appliedBundle = null;

    if (activeBundle) {
      const bundle = activeBundle.bundle;
      if (bundle && bundle.isActive !== false) {
        const now = new Date();
        const isExpired = activeBundle.expirationDate && activeBundle.expirationDate < now;
        const hasUsesRemaining = activeBundle.remainingUses === undefined || activeBundle.remainingUses === null || activeBundle.remainingUses > 0;

        if (isExpired) {
          activeBundle.status = "EXPIRED";
          await activeBundle.save({ session });
        } else if (hasUsesRemaining) {
          appliedBundle = activeBundle;
          const discountPercent = bundle.discount || 0;
          discountAmount = (offer.price * discountPercent) / 100;
          finalPrice = Math.max(0, offer.price - discountAmount);

          if (activeBundle.remainingUses !== undefined && activeBundle.remainingUses !== null) {
            activeBundle.remainingUses -= 1;
            if (activeBundle.remainingUses <= 0) {
              activeBundle.status = "EXPIRED";
            }
          }
          await activeBundle.save({ session });
        }
      }
    }

    if (wallet.balance < finalPrice) {
      throw new ApiError("Insufficient wallet balance", 400);
    }

    wallet.balance -= finalPrice;
    wallet.holdBalance = (wallet.holdBalance || 0) + finalPrice;
    wallet.totalSpent = (wallet.totalSpent || 0) + finalPrice;
    wallet.lastTransactionAt = new Date();

    const newBooking = new Booking({
      request: request._id,
      offer: offer._id,
      client: request.client,
      caregiver: offer.caregiver,
      price: finalPrice,
      originalPrice: offer.price,
      discountAmount: discountAmount,
      finalPrice: finalPrice,
      bundleUsed: appliedBundle ? appliedBundle._id : null,
      bookingStatus: "ACCEPTED",
    });

    await newBooking.save({ session });

    const transaction = new Transaction({
      userlog: userId,
      wallet: wallet._id,
      booking: newBooking._id,
      amount: finalPrice,
      originalAmount: offer.price,
      discountAmount: discountAmount,
      finalChargedAmount: finalPrice,
      bundleUsed: appliedBundle ? appliedBundle._id : null,
      type: "BOOKING_PAYMENT",
      paymentMethod: "CARD",
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