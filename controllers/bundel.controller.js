const bundleModel = require("../models/bundel.model");
const bundleService = require("../services/bundel.services");
const ClientBundle = require("../models/clientbundel.model");

exports.createBundle = async (req, res, next) => {
    const bundle = await bundleService.createBundleService(req.user,req.body);
    res.status(201).json({
      message: "Bundle created",
      data: bundle,
    });
};


exports.updateBundle = async (req, res, next) => {
    const bundle = await bundleService.updateBundleService(req.user,req.body);
    res.status(200).json({
        message: "Bundle updated successfully",
        data: bundle,
    });
};


exports.getAllBundle= async (req, res, next) => {
    const bundle = await bundleModel.find({});
    res.status(200).json({
        message: "Bundles fetched successfully",
        data: bundle,
    });
};


exports.updateBundle = async (req, res, next) => {
    const bundle = await bundleService.updateBundleService(
        req.user,
        req.params.id,
        req.body
    );

    res.status(200).json({
        message: "Bundle updated successfully",
        data: bundle,
    });
};


exports.deletebundle = async (req, res, next) => {
    const bundle = await bundleService.deleteBundleService(req.user,req.params);
    res.status(200).json({
        message: "Bundle deleted successfully",
        data: null,
    });
};




exports.chooseBundle = async (req, res, next) => {
  try {
    const { bundleId } = req.body;

    const bundle = await bundleService.getBundleByIdService(req.user, bundleId);
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    if (bundle.isActive === false) {
      return res.status(400).json({ message: "Bundle is inactive" });
    }

    const existingActive = await ClientBundle.findOne({
      client: req.user._id,
      bundle: bundle._id,
      status: "ACTIVE"
    });

    if (existingActive) {
      return res.status(400).json({ message: "You already have an active subscription for this bundle" });
    }

    const clientBundle = await ClientBundle.create({
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

