const walletService = require("../services/wallet.services");
const { ApiError } = require("../Utills/ApiError");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const clientBundleModel = require("../models/clientbundel.model");
const bundleModel = require("../models/bundel.model");


exports.getWalletBalance = async (req, res, next) => {
  const wallet = await walletService.getWalletBalanceService(req.user._id);
  res.status(200).json({
    data: wallet,
  });
};

exports.deposit = async (req, res, next) => {
    const wallet = await walletService.depositService(req.user._id, req.body.amount);
    res.status(200).json({
      message: "Deposit successful",
      data: wallet,
    });
};


exports.pay = async (req, res, next) => {
  
    const { amount } = req.body;

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    wallet.balance -= amount;
    wallet.totalSpent += amount;
    wallet.lastTransactionAt = new Date();

    await wallet.save();

    await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      type: "PAYMENT",
      amount,
      status: "COMPLETED",
    });

    res.status(200).json({
      message: "Payment successful",
      data: wallet,
    });

};

exports.refund = async (req, res, next) => {
    const { amount } = req.body;

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.balance += amount;
    wallet.lastTransactionAt = new Date();

    await wallet.save();

    await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      type: "REFUND",
      amount,
      status: "COMPLETED",
    });

    res.status(200).json({
      message: "Refund successful",
      data: wallet,
    });

};///
//3aww