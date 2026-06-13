const bundleModel = require("../models/bundel.model");
const requestModel = require("../models/request.model");
const { ApiError } = require("../Utills/ApiError");

const createBundleService=async (user,data)=>{
    const {client,caregiver,services,price,discount,bundle_name,bundle_description,features,validity,sessions}=data;
    const bundle=await bundleModel.create({
        client,
        caregiver,
        services,
        price,
        discount,
        bundle_name,
        bundle_description,
        features,
        validity,
        sessions
    });
    return bundle;
}

const getAllBundleService=async (user,data)=>{
    const bundle=await bundleModel.find({});
    return bundle;
}
const getBundleByIdService=async (user,data)=>{
    const bundle=await bundleModel.findById(data.id);
    return bundle;
}

const updateBundleService = async (user, bundleId, data) => {
    const bundle = await bundleModel.findByIdAndUpdate(
        bundleId,
        data,
        { new: true }
    );

    return bundle;
};
const deleteBundleService=async (user,data)=>{
    const bundle=await bundleModel.findByIdAndDelete(data.id);
    return bundle;
}


module.exports={
    createBundleService,
    getAllBundleService,
    getBundleByIdService,
    updateBundleService,
    deleteBundleService,
}
