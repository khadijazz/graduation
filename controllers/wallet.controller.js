const walletService = require("../services/wallet.services");
const { ApiError } = require("../Utills/ApiError");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const clientBundleModel = require("../models/clientbundel.model");
const bundleModel = require("../models/bundel.model");

exports.getWalletBalance = async (req, res) => {

  const wallet =
    await walletService.getWalletBalance(
      req.user._id
    );

  res.status(200).json({
    status: "success",
    message: "Wallet balance fetched successfully",
    data: wallet
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

};

exports.getWalletById = async (req, res, next) => {
  const wallet = await Wallet.findById(req.params.id);
  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found" });
  }
  res.status(200).json({
    status: "success",
    message: "Wallet fetched successfully",
    data: wallet,
  });
};

exports.updateWallet = async (req, res, next) => {
  const wallet = await Wallet.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found" });
  }
  res.status(200).json({
    status: "success",
    message: "Wallet updated successfully",
    data: wallet,
  });
};

exports.deleteWallet = async (req, res, next) => {
  const wallet = await Wallet.findByIdAndDelete(req.params.id);
  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found" });
  }
  res.status(200).json({
    status: "success",
    message: "Wallet deleted successfully",
    data: wallet,
  });
};