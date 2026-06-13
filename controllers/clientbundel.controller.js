const mongoose = require("mongoose");
const { ApiError } = require("../Utills/ApiError");
const clientBundleModel = require("../models/clientbundel.model");  
const bundleModel = require("../models/bundel.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const { createNotification } = require("../services/notification.services");

function calculateExpirationDate(purchaseDate, validity) {
  if (!validity) return null;
  const match = validity.match(/^(\d+)\s*(day|month|year|week)s?$/i);
  const date = new Date(purchaseDate);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit === "day") {
      date.setDate(date.getDate() + value);
    } else if (unit === "month") {
      date.setMonth(date.getMonth() + value);
    } else if (unit === "year") {
      date.setFullYear(date.getFullYear() + value);
    } else if (unit === "week") {
      date.setDate(date.getDate() + value * 7);
    }
  } else {
    const value = parseInt(validity, 10);
    if (!isNaN(value)) {
      date.setDate(date.getDate() + value);
    } else {
      date.setDate(date.getDate() + 30);
    }
  }
  return date;
}

exports.chooseBundle = async (req, res, next) => {
  try {
    const { bundleId } = req.params;
   

    const bundle = await bundleModel.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    if (bundle.isActive === false) {
      return res.status(400).json({ message: "Bundle is inactive" });
    }

    const existingActive = await clientBundleModel.findOne({
      client: req.user._id,
      bundle: bundle._id,
      status: "ACTIVE"
    });

    if (existingActive) {
      return res.status(400).json({ message: "You already have an active subscription for this bundle" });
    }

    const clientBundle = await clientBundleModel.create({
      client: req.user._id,
      bundle: bundle._id,
      price: bundle.price,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Bundle selected",
      data: clientBundle,
    });
  } catch (error) {
    next(error);
  }
};

exports.payBundle = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bundleId = req.params.id || req.body.bundleId;

    const bundle = await bundleModel.findById(bundleId).session(session);
    if (!bundle) {
      throw new ApiError("Bundle not found", 404);
    }

    if (bundle.isActive === false) {
      throw new ApiError("Bundle is inactive", 400);
    }

    const existingActive = await clientBundleModel.findOne({
      client: req.user._id,
      bundle: bundle._id,
      status: "ACTIVE"
    }).session(session);

    if (existingActive) {
      throw new ApiError("You already have an active subscription for this bundle", 400);
    }

    const wallet = await Wallet.findOne({ userlog: req.user._id }).session(session);
    if (!wallet) {
      throw new ApiError("Wallet not found", 404);
    }

    if (wallet.balance < bundle.price) {
      throw new ApiError("Insufficient balance", 400);
    }

    wallet.balance -= bundle.price;
    wallet.totalSpent = (wallet.totalSpent || 0) + bundle.price;
    await wallet.save({ session });

    const purchaseDate = new Date();
    const clientBundles = await clientBundleModel.create(
      [
        {
          client: req.user._id,
          bundle: bundle._id,
          price: bundle.price,
          status: "ACTIVE",
          purchaseDate,
          remainingUses: bundle.sessions || 0,
          expirationDate: calculateExpirationDate(purchaseDate, bundle.validity),
        },
      ],
      { session }
    );
    const clientBundle = clientBundles[0];

    const transaction = new Transaction({
      userlog: req.user._id,
      wallet: wallet._id,
      amount: bundle.price,
      type: "payment",
      status: "COMPLETED",
      description: "Bundle payment",
      bundleUsed: clientBundle._id,
    });
    await transaction.save({ session });

    wallet.transactions.push(transaction._id);
    await wallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    await createNotification({
      recipientId: req.user._id,
      recipientRole: "client",
      notificationType: "BUNDLE_PURCHASED",
      title: "Bundle Purchased",
      message: "Bundle purchased successfully.",
      relatedEntityId: clientBundle._id,
      relatedEntityType: "ClientBundle"
    });

    res.status(200).json({
      message: "Bundle paid successfully and subscription is active",
      data: clientBundle,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


exports.cancelBundle = async (req, res, next) => {

    const { clientBundleId } = req.params;

    const clientBundle = await clientBundleModel.findById(clientBundleId);

    if (!clientBundle) {
      return res.status(404).json({ message: "Not found" });
    }

    if (clientBundle.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (clientBundle.status === "CANCELLED") {
      return res.status(400).json({ message: "Already cancelled" });
    }

   
    if (clientBundle.status === "PAID") {
      const wallet = await Wallet.findOne({ user: req.user._id });

      wallet.balance += clientBundle.price;
      await wallet.save();

      await Transaction.create({
        user: req.user._id,
        wallet: wallet._id,
        amount: clientBundle.price,
        type: "refund",
        status: "COMPLETED",
        description: "Bundle refund",
        bundleUsed: clientBundle._id,
      });
    }

    clientBundle.status = "CANCELLED";
    await clientBundle.save();

    res.status(200).json({
      message: "Bundle cancelled",
      data: clientBundle,
    });
  };

  exports.getallbundle = async (req, res, next) => {
      const query = req.user.role === "admin" ? {} : { client: req.user._id };
      const clientBundles = await clientBundleModel.find(query).populate("bundle");
      res.status(200).json({
        status: "success",
        data: clientBundles,
      });
  };

  exports.getBundleById = async (req, res, next) => {
      const clientBundle = await clientBundleModel.findById(req.params.id).populate("bundle");
      if (!clientBundle) {
        return res.status(404).json({ message: "Client bundle not found" });
      }
      if (req.user.role !== "admin" && clientBundle.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.status(200).json({
        status: "success",
        data: clientBundle,
      });
  };