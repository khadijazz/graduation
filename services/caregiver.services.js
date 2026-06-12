const caregiver=require("../models/caregiver.model");
const userlog=require("../models/userlog.model");
const Wallet=require("../models/wallet.model");
const {ApiFeature}=require("../Utills/ApiFeature.js");
const {ApiError}=require("../Utills/ApiError.js");

const createcaregiver = async (data) => {
  const existingUser = await userlog.findOne({ email: data.email });
  const existingCaregiver = await caregiver.findOne({ email: data.email });

  if (existingUser || existingCaregiver) {
    throw new ApiError("Email already exists", 400);
  }

  const newCaregiver = await caregiver.create(data);

  try {
    await Wallet.create({
      userlog: newCaregiver._id,
      ownerModel: "Caregiver",
      balance: 0,
      holdBalance: 0
    });
  } catch (err) {
    await caregiver.findByIdAndDelete(newCaregiver._id);
    throw err;
  }

  return newCaregiver;
};

const getallcaregiver = (queryParams) =>{
    const apiFeature=new ApiFeature(caregiver.find({}),queryParams);
    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();
    return apiFeature.dbQuery;
};
const getcaregiverbyid=(id)=>caregiver.findById(id);
const updatecaregiver=(id,updates)=>caregiver.findByIdAndUpdate(id,updates,{new:true,runValidators:true});
const deletecaregiver=(id)=>caregiver.findByIdAndDelete(id);
const deleteAllCaregivers = () => caregiver.deleteMany();

const bcrypt = require("bcryptjs");
const checkCaregiverStatus = async (email, password) => {
  const caregiverDoc = await caregiver.findOne({ email }).select("+password");
  if (!caregiverDoc) {
    throw new ApiError("no caregiver found with this email", 400);
  }
  const isCorrect = await bcrypt.compare(password, caregiverDoc.password);
  if (!isCorrect) {
    throw new ApiError("email or password is wrong", 400);
  }
  if (caregiverDoc.isBlocked) {
    throw new ApiError("Your account has been blocked. Please contact support.", 403);
  }
  return caregiverDoc.status;
};

module.exports={createcaregiver,getallcaregiver,getcaregiverbyid,updatecaregiver,deletecaregiver,deleteAllCaregivers,checkCaregiverStatus}