const caregiver=require("../models/caregiver.model");
const userlog=require("../models/userlog.model");
const Wallet=require("../models/wallet.model");
const Booking=require("../models/booking.model");
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

const getallcaregiver = async (queryParams) => {
    const apiFeature = new ApiFeature(
        caregiver.find({ status: "Verified" })
            .select("full_name email createdAt status speciality"),
        queryParams
    );

    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();

    const caregivers = await apiFeature.dbQuery;

    return Promise.all(
        caregivers.map(async (cg) => ({
            ...cg.toObject(),
            bookingsCount: await Booking.countDocuments({
                caregiver: cg._id
            })
        }))
    );
};
const getcaregiverbyid=(id)=>caregiver.findById(id);
const updatecaregiver=(id,updates)=>caregiver.findByIdAndUpdate(id,updates,{new:true,runValidators:true});
const deletecaregiver=(id)=>caregiver.findByIdAndDelete(id);
const deleteAllCaregivers = () => caregiver.deleteMany();



module.exports={createcaregiver,getallcaregiver,getcaregiverbyid,updatecaregiver,deletecaregiver,deleteAllCaregivers}