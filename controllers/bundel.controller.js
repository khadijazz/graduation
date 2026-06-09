const bundleModel = require("../models/bundel.model");
const ClientBundle = require("../models/clientbundel.model");

exports.createBundle = async (req, res, next) => {
    const {client,caregiver,services,price,discount,totalPrice} = req.body;
    const bundle = await bundleModel.create({client,caregiver,services,price,discount,totalPrice});
    res.status(201).json({
      message: "Bundle created",
      data: bundle,
    });
};

exports.getallbundle= async (req, res, next) => {
    const bundle = await bundleModel.find({});
    res.status(200).json({
        message: "Bundles fetched successfully",
        data: bundle,
    });
};

exports.getbundlebyid = async (req, res, next) => {
    const bundle = await bundleModel.findById(req.params.id);
    res.status(200).json({
        message: "Bundle fetched successfully",
        data: bundle,
    });
};

exports.updatebundle = async (req, res, next) => {
    const bundle = await bundleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
        message: "Bundle updated successfully",
        data: bundle,
    });
};


exports.deletebundle = async (req, res, next) => {
    const bundle = await bundleModel.findByIdAndDelete(req.params.id);
    res.status(200).json({
        message: "Bundle deleted successfully",
        data: bundle,
    });
};




exports.chooseBundle = async (req, res, next) => {
  
    const { bundleId } = req.body;

    const bundle = await bundleModel.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    const clientBundle = await ClientBundle.create({
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

