const Booking = require("../models/booking.model");
const Request=require("../models/request.model");
const Offer=require("../models/offer.model");
const Wallet = require("../models/wallet.model");
const { ApiFeature } = require("../Utills/ApiFeature");

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
const getbookingbyid = (id) => booking.findById(id);
const updatebooking = (id, updates) => booking.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deletebooking = (id) => booking.findByIdAndDelete(id);

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

  booking.status = "CONFIRMED";
  await booking.save();

  return booking;
};

module.exports={createBookingFromOffer,getallbooking,getbookingbyid,updatebooking,deletebooking,confirmBookingAndPay,createBookingFromOffer}