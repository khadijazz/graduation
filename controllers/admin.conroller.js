const {ApiError}=require("../Utills/ApiError");
const adminServices=require("../services/admin.services");


exports.createadmin = async (req,res,next)=>{

  const userData = req.body;
  const admin = await adminServices.createadmin(userData);

  res.status(201).json({
    status: "success",
    data: admin
  });
};


exports.deleteadmin = async (req, res, next) => {

  const user = await adminServices.deleteadmin(
    req.user._id
  );

  res.status(200).json({
    status: "success",
    message: "Account deleted successfully",
    data: null
  });
};