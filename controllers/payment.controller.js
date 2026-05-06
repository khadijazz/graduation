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

exports.createPayment = async (req, res, next) => {
  try {
    const {
      amount,
      purpose,
      paymentMethod,
      bookingId,
      walletPhone,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["DEPOSIT", "BOOKING_PAYMENT"].includes(purpose)) {
      return res.status(400).json({ message: "Invalid payment purpose" });
    }

    if (!["CARD", "MOBILE_WALLET"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let booking = null;

    if (purpose === "BOOKING_PAYMENT") {
      if (!bookingId) {
        return res.status(400).json({ message: "bookingId is required" });
      }

      booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userlog: req.user._id },
      {
        $setOnInsert: {
          userlog: req.user._id,
          balance: 0,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const transaction = await Transaction.create({
      userlog: req.user._id,
      wallet: wallet._id,
      booking: booking ? booking._id : undefined,
      amount,
      type: purpose,
      paymentMethod,
      status: "PENDING",
    });

    const integrationId =
      paymentMethod === "CARD"
        ? process.env.PAYMOB_CARD_INTEGRATION_ID
        : process.env.PAYMOB_WALLET_INTEGRATION_ID;

    const authToken = await getAuthToken();
    const orderId = await createOrder(authToken, amount, transaction._id);
    const paymentKey = await createPaymentKey(
      authToken,
      orderId,
      amount,
      req.user,
      integrationId
    );

    transaction.paymobOrderId = orderId;
    await transaction.save();

    if (paymentMethod === "CARD") {
      const iframeUrl =
        `https://accept.paymobsolutions.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

      return res.status(200).json({
        success: true,
        transactionId: transaction._id,
        paymentMethod: "CARD",
        iframeUrl,
      });
    }

    if (!walletPhone) {
      return res.status(400).json({
        message: "walletPhone is required for mobile wallet payment",
      });
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

    res.status(200).json({
      success: true,
      transactionId: transaction._id,
      paymentMethod: "MOBILE_WALLET",
      data: walletPaymentResponse.data,
    });

  } catch (error) {
    next(error);
  }
};

exports.paymobCallback = async (req, res, next) => {
  try {
    const obj = req.body.obj || req.body;

    const merchantOrderId = obj.order?.merchant_order_id;
    const paymobTransactionId = obj.id;
    const success = obj.success === true || obj.success === "true";

    const transaction = await Transaction.findById(merchantOrderId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === "COMPLETED") {
      return res.status(200).json({ message: "Already processed" });
    }

    transaction.paymobTransactionId = paymobTransactionId;

    if (!success) {
      transaction.status = "FAILED";
      await transaction.save();

      return res.status(200).json({
        message: "Payment failed recorded",
      });
    }

    transaction.status = "COMPLETED";
    await transaction.save();

    const wallet = await Wallet.findById(transaction.wallet);

    if (transaction.type === "DEPOSIT") {
      wallet.balance += transaction.amount;
      wallet.totalDeposited += transaction.amount;
    }

    if (transaction.type === "BOOKING_PAYMENT") {
      wallet.totalSpent += transaction.amount;

      if (transaction.booking) {
        await Booking.findByIdAndUpdate(transaction.booking, {
          BookingStatus: "confirmed",
        });
      }
    }

    wallet.transactions.push(transaction._id);
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    res.status(200).json({
      message: "Callback processed successfully",
    });

  } catch (error) {
    next(error);
  }
};