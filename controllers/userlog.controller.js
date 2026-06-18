const {ApiError}=require("../Utills/ApiError");
const userlogServices=require("../services/userlog.services");
const { uploadToCloudinary } = require("../Utills/uploadCloudinary");



exports.createuserlog = async (req,res,next)=>{

  const userData = { ...req.body };

  if (req.files?.profile_picture) {
    userData.profile_picture = await uploadToCloudinary(
      req.files.profile_picture[0]
    );
  }

  if (req.files?.national_id) {
    userData.national_id = await uploadToCloudinary(
      req.files.national_id[0]
    );
  }


  const userlog = await userlogServices.createUserLog(userData);

  res.status(201).json({
    status: "success",
    data: userlog
  });
};
exports.loginUser = async (req, res, next) => {
  const result = await userlogServices.loginUser(req.body);

  console.log("RESULT =", result);

  res.status(200).json({
    status: "success",
    message: "User logged in successfully",
    data: {
      user: result.user,
      token: result.token
    }
  });
};

exports.getallusers=async(req,res,next)=>{
  const users = await userlogServices.getAllUsers();
  res.status(200).json({
    total:users.length,
    status: "success",
    data: users
  });
}

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
    req.protocol,      
    req.get("host")    
  );
 
  res.status(200).json({
    status: "success",
    message: "Reset link sent to your email! Valid for 10 minutes.",
    data: null,
  });
};

exports.resetPassword = async (req, res, next) => {
  const token = await userlogServices.resetPassword(
    req.params.token,              
    req.body.password,             
    req.body.passwordConfirmation  
  );
 
  res.status(200).json({
    status: "success",
    message: "Password reset successfully. You are now logged in.",
    data: token,   
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

exports.deleteuserlog = async (req, res, next) => {

  const user = await userlogServices.deleteUserLog(
    req.user._id
  );

  res.status(200).json({
    status: "success",
    message: "Account deleted successfully",
    data: null
  });
};

exports.openResetPassword = async (req, res) => {
  const { token } = req.params;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ehtmam</title>
      <meta charset="utf-8" />
    </head>
    <body>
      <script>
        window.location.href = "ehtmam://reset-password/${token}";
      </script>

      <h2>Opening Ehtmam App...</h2>

      <p>
        If the app does not open automatically,
        please make sure Ehtmam is installed.
      </p>
    </body>
    </html>
  `);
};