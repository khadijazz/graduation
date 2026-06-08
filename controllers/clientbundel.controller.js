const clientBundleService = require("../services/clientbundel.services");
const { ApiError } = require("../Utills/ApiError");
const clientBundleModel = require("../models/clientbundel.model");  
const bundleModel = require("../models/bundel.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
////
exports.chooseBundle = async (req, res, next) => {
 
 const { bundleId } = req.body;

    const bundle = await bundleModel.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    const clientBundle = await clientBundleModel.create({
      client: req.user._id,
      bundle: bundle._id,
      price: bundle.bundlePrice,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Bundle selected",
      data: clientBundle,
    });

};
exports.payBundle = async (req, res, next) => {

    const { clientBundleId } = req.body;

    const clientBundle = await clientBundleModel.findById(clientBundleId);

    if (!clientBundle) {
      return res.status(404).json({ message: "Not found" });
    }

    if (clientBundle.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (clientBundle.status !== "PENDING") {
      return res.status(400).json({ message: "Already processed" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (wallet.balance < clientBundle.price) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    wallet.balance -= clientBundle.price;
    await wallet.save();

    await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      amount: clientBundle.price,
      type: "payment",
      status: "COMPLETED",
      description: "Bundle payment",
    });

    clientBundle.status = "PAID";
    await clientBundle.save();

    res.status(200).json({
      message: "Bundle paid successfully",
      data: clientBundle,
    });
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
      });
    }

    clientBundle.status = "CANCELLED";
    await clientBundle.save();

    res.status(200).json({
      message: "Bundle cancelled",
      data: clientBundle,
    });
  };

  //3aw