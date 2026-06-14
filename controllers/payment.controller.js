const paymentService = require("../services/payment.services.js");

exports.createPayment = async (req, res, next) => {
  try {
    const result = await paymentService.createWalletTopup(req.user, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.paymobCallback = async (req, res, next) => {
  try {
    const result = await paymentService.handlePaymobCallback(req.body, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.payBookingFromWallet = async (req, res, next) => {
  try {
    const result = await paymentService.payBookingFromWallet(req.user, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
exports.paymobRedirect = async (req, res, next) => {
  try {
    await paymentService.handlePaymobRedirect(req, res);
  } catch (error) {
    next(error);
  }
};