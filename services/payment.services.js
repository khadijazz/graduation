const axios = require("axios");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const Booking = require("../models/booking.model");

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

async function getAuthToken() {
  const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
    api_key: PAYMOB_API_KEY,
  });
  return response.data.token;
}

async function createOrder(authToken, amount, transactionId) {
  const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amount * 100,
    currency: "EGP",
    merchant_order_id: transactionId.toString(),
    items: [],
  });

  return response.data.id;
}

async function createPaymentKey(authToken, orderId, amount, user, integrationId) {
  const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amount * 100,
    expiration: 3600,
    order_id: orderId,
    billing_data: {
      first_name: user.full_name || "Customer",
      last_name: "User",
      phone_number: user.phone || "01000000000",
      email: user.email || "customer@example.com",
      country: "EG",
      city: "Cairo",
      street: "NA",
      building: "NA",
      floor: "NA",
      apartment: "NA",
    },
    currency: "EGP",
    integration_id: integrationId,
  });

  return response.data.token;
}

exports.createWalletTopup = async (user, body) => {
  const { amount, paymentMethod, walletPhone } = body;

  if (!amount || amount <= 0) throw new Error("Invalid amount");

  if (!["CARD", "MOBILE_WALLET"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const wallet = await Wallet.findOneAndUpdate(
    { userlog: user._id },
    { $setOnInsert: { userlog: user._id, balance: 0 } },
    { returnDocument: "after", upsert: true }
  );

  const transaction = await Transaction.create({
    userlog: user._id,
    wallet: wallet._id,
    amount,
    type: "DEPOSIT",
    paymentMethod,
    status: "PENDING",
  });

  const integrationId =
    paymentMethod === "CARD"
      ? process.env.PAYMOB_CARD_INTEGRATION_ID
      : process.env.PAYMOB_WALLET_INTEGRATION_ID;

  const authToken = await getAuthToken();
  const orderId = await createOrder(authToken, amount, transaction._id);
  const paymentKey = await createPaymentKey(authToken, orderId, amount, user, integrationId);

  transaction.paymobOrderId = orderId;
  await transaction.save();

  if (paymentMethod === "CARD") {
    return {
      transactionId: transaction._id,
      paymentMethod: "CARD",
      iframeUrl: `https://accept.paymobsolutions.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`,
    };
  }

  if (!walletPhone) {
    throw new Error("walletPhone is required for mobile wallet payment");
  }

  const walletPaymentResponse = await axios.post(
    `${PAYMOB_API_URL}/acceptance/payments/pay`,
    {
      source: {
        identifier: walletPhone,
        subtype: "WALLET",
      },
      payment_token: paymentKey,
    }
  );

  return {
    transactionId: transaction._id,
    paymentMethod: "MOBILE_WALLET",
    data: walletPaymentResponse.data,
  };
};

exports.handlePaymobCallback = async (body, query) => {
  const obj = body.obj || body || query;

  const merchantOrderId =
    obj.order?.merchant_order_id ||
    obj.merchant_order_id ||
    obj.order_id;

  const paymobTransactionId = obj.id;
  const success = obj.success === true || obj.success === "true";

  const transaction = await Transaction.findById(merchantOrderId);
  if (!transaction) throw new Error("Transaction not found");

  if (transaction.status === "COMPLETED") {
    return { message: "Already processed" };
  }

  transaction.paymobTransactionId = paymobTransactionId;

  if (!success) {
    transaction.status = "FAILED";
    await transaction.save();
    return { message: "Payment failed recorded" };
  }

  transaction.status = "COMPLETED";
  await transaction.save();

  const wallet = await Wallet.findById(transaction.wallet);

  wallet.balance += transaction.amount;
  wallet.totalDeposited += transaction.amount;
  wallet.lastTransactionAt = new Date();
  wallet.transactions.push(transaction._id);

  await wallet.save();

  return { message: "Wallet top-up completed successfully" };
};

exports.payBookingFromWallet = async (user, body) => {
  const { bookingId, amount } = body;

  if (!bookingId) throw new Error("bookingId is required");
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const wallet = await Wallet.findOne({ userlog: user._id });
  if (!wallet) throw new Error("Wallet not found");

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  wallet.totalSpent += amount;
  wallet.lastTransactionAt = new Date();

  const transaction = await Transaction.create({
    userlog: user._id,
    wallet: wallet._id,
    booking: booking._id,
    amount,
    type: "BOOKING_PAYMENT",
    paymentMethod: "INTERNAL_WALLET",
    status: "COMPLETED",
  });

  wallet.transactions.push(transaction._id);
  await wallet.save();

  booking.BookingStatus = "confirmed";
  await booking.save();

  return {
    message: "Booking paid successfully from wallet",
    data: { wallet, booking, transaction },
  };
};