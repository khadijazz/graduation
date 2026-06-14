const walletService = require("../services/wallet.services");
const { ApiError } = require("../Utills/ApiError");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const clientBundleModel = require("../models/clientbundel.model");
const bundleModel = require("../models/bundel.model");
const Booking = require("../models/booking.model");

exports.getWalletBalance = async (req, res) => {
  try {
    const wallet = await walletService.getWalletBalance(req.user._id);

    let pendingBalance = 0;
    if (req.user.role === "caregiver" || wallet.ownerModel === "Caregiver") {
      const pendingBookings = await Booking.find({
        caregiver: req.user._id,
        bookingStatus: { $in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] }
      });
      pendingBalance = pendingBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    } else {
      pendingBalance = wallet.holdBalance || 0;
    }

    const txns = await Transaction.find({ userlog: req.user._id })
      .populate("userlog")
      .populate({
        path: "booking",
        populate: [
          { path: "client" },
          { path: "caregiver" },
          {
            path: "request",
            populate: { path: "service" }
          }
        ]
      })
      .populate({
        path: "bundleUsed",
        populate: [
          { path: "client" },
          { path: "bundle" }
        ]
      })
      .sort({ createdAt: -1 });

    const enrichedTransactions = txns.map(txn => {
      const plainTxn = txn.toObject ? txn.toObject() : txn;
      
      let clientName = "";
      if (plainTxn.booking && plainTxn.booking.client) {
        clientName = plainTxn.booking.client.full_name || "";
      } else if (plainTxn.bundleUsed && plainTxn.bundleUsed.client) {
        clientName = plainTxn.bundleUsed.client.full_name || "";
      } else if (plainTxn.userlog && plainTxn.ownerModel === "Userlog") {
        clientName = plainTxn.userlog.full_name || "";
      }

      let caregiverName = undefined;
      if (plainTxn.booking && plainTxn.booking.caregiver) {
        caregiverName = plainTxn.booking.caregiver.full_name || undefined;
      } else if (plainTxn.userlog && plainTxn.ownerModel === "Caregiver") {
        caregiverName = plainTxn.userlog.full_name || undefined;
      }

      let serviceName = undefined;
      if (plainTxn.booking && plainTxn.booking.request && plainTxn.booking.request.service) {
        serviceName = plainTxn.booking.request.service.serviceName || undefined;
      }

      let bundleName = undefined;
      if (plainTxn.bundleUsed && plainTxn.bundleUsed.bundle) {
        bundleName = plainTxn.bundleUsed.bundle.bundle_name || undefined;
      }

      return {
        ...plainTxn,
        transactionId: plainTxn._id,
        transactionType: plainTxn.type,
        transactionStatus: plainTxn.status,
        amount: plainTxn.amount,
        description: plainTxn.description || "",
        clientName,
        caregiverName,
        serviceName,
        bundleName,
        paymentMethod: plainTxn.paymentMethod || "CARD",
        transactionDate: plainTxn.createdAt
      };
    });

    const dashboard = {
      availableBalance: wallet.balance || 0,
      totalEarned: wallet.totalEarned || 0,
      pendingBalance,
      transactions: enrichedTransactions
    };

    res.status(200).json({
      status: "success",
      message: "Wallet balance fetched successfully",
      availableBalance: wallet.balance || 0,
      totalEarned: wallet.totalEarned || 0,
      pendingBalance,
      transactions: enrichedTransactions,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
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

exports.getMyWallet = async (req, res, next) => {
  const model =
    req.user.role === "caregiver"
      ? "Caregiver"
      : "Userlog";

  const wallet = await Wallet.findOne({
    userlog: req.user._id,
    ownerModel: model
  });

  if (!wallet) {
    return res.status(404).json({
      message: "Wallet not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: wallet
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


