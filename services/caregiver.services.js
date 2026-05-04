const caregiver=require("../models/caregiver.model");
const userlog=require("../models/userlog.model");
const {ApiFeature}=require("../Utills/ApiFeature.js");

const createcaregiver=(data)=>caregiver.create(data);
const getallcaregiver = (queryParams) =>{
    const apiFeature=new ApiFeature(caregiver.find({}).populate("userId", "full_name email"),queryParams);
    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();
    return apiFeature.dbQuery;
};
const getcaregiverbyid=(id)=>caregiver.findById(id).populate("userId", "full_name email");
const updatecaregiver=(id,updates)=>caregiver.findByIdAndUpdate(id,updates,{new:true,runValidators:true});
const deletecaregiver=(id)=>caregiver.findByIdAndDelete(id);
const deleteAllCaregivers = () => caregiver.deleteMany();
module.exports={createcaregiver,getallcaregiver,getcaregiverbyid,updatecaregiver,deletecaregiver,deleteAllCaregivers}