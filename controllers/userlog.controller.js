const {ApiError}=require("../Utills/ApiError");
const userlogServices=require("../services/userlog.services");




exports.createuserlog=async(req,res,next)=>{
    const userlog = await userlogServices.createUserLog(req.body);
    userlog.password=undefined;
    res.status(201).json({
      status: "success",
      data: userlog
    });
 
};

exports.loginUser=async(req,res,next)=>{
    const token = await userlogServices.loginUser(req.body);
    res.status(200).json({
      status: "success",
      message:"User logged in insuccessfully",
      data: token
      
    });
 
};

exports.finduserlogbyid=async(req,res,next)=>{
  const userlog = await userlogServices.getUserById(req.params.id);
  userlog.password=undefined;
  res.status(200).json({
    status: "success",
    data: userlog
  });
}