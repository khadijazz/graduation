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

exports.forgotPassword = async (req, res, next) => {
  await userlogServices.forgotPassword(
    req.body,
    req.protocol,      // "http" or "https" — used to build the reset URL
    req.get("host")    // e.g. "localhost:4000"
  );
 
  res.status(200).json({
    status: "success",
    message: "Reset link sent to your email! Valid for 10 minutes.",
    data: null,
  });
};

exports.resetPassword = async (req, res, next) => {
  const token = await userlogServices.resetPassword(
    req.params.token,              // plain token from the URL
    req.body.password,             // new password
    req.body.passwordConfirmation  // must match password
  );
 
  res.status(200).json({
    status: "success",
    message: "Password reset successfully. You are now logged in.",
    data: token,   // JWT — same shape as loginUser response
  });
};
exports.updatePassword = async (req, res, next) => {
  const token = await userlogServices.updatePassword(
    req.user._id,                      
    req.body.currentPassword,          
    req.body.password,                 
    req.body.passwordConfirmation    
  );
  res.status(200).json({
    status: "success",
    message: "Password updated successfully. You are now logged in.",
    data: token,
  });
};
 