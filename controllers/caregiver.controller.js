const caregiverServices = require("../services/caregiver.services");
const userlogServices = require("../services/userlog.services");
const {ApiError}=require("../Utills/ApiError");
const { uploadToCloudinary } = require("../Utills/uploadCloudinary");

exports.newCaregiver=  async (req, res) => {
          const caregiverData = req.body;


    if (req.files.profile_picture) {
  caregiverData.profile_picture = req.files.profile_picture[0].path;
   }

 if (req.files.certifications) {
  caregiverData.certifications = req.files.certifications.map(file => file.path);
  }

 if (req.files.verifcation_documents) {
  caregiverData.verifcation_documents = req.files.verifcation_documents.map(file => file.path);
  }
 if (req.files?.profile_picture) {

  caregiverData.profile_picture =
    await uploadToCloudinary(
      req.files.profile_picture[0]
    );
}

if (req.files?.certifications) {

  caregiverData.certifications =
    await Promise.all(

      req.files.certifications.map(
        async (file) =>
          await uploadToCloudinary(file)
      )

    );
}

if (req.files?.verifcation_documents) {

  caregiverData.verifcation_documents =
    await Promise.all(

      req.files.verifcation_documents.map(
        async (file) =>
          await uploadToCloudinary(file)
      )

    );
}

        const caregiver = await caregiverServices.createcaregiver(caregiverData); 
        res.status(201).json({
            status: "success",
            message: "caregiver created successfully",
            data: caregiver, 
        });
}

exports.loginCaregiver=async(req,res,next)=>{
    const token = await userlogServices.loginUser(req.body);
    res.status(200).json({
      status: "success",
      message:"caregiver logged in successfully",
      data: token
      
    });
 
};

exports.getCareGiver = async (req,res)=>{
        const caregiverr=await caregiverServices.getcaregiverbyid(req.params.id);
        if(!caregiverr){
            throw new ApiError("caregiver not found",404)
        }
        res.status(200).json({
            status:"success",
            message:"caregivers retrieved successfully",
            data:caregiverr,
        });
}


exports.getallcaregiver = async (req, res, next) => {

    const caregivers = await caregiverServices.getallcaregiver(req.query);

    res.status(200).json({
        status: "success",
        length: caregivers.length,
        data: {
            caregivers
        }
    });
};


exports.updateCareGiver = async (req,res)=>{
        const updateData=req.body;
        const newCaregiver=await caregiverServices.updatecaregiver(req.params.id,updateData);
        if(!newCaregiver){
            throw new ApiError("caregiver not found",404)
        }
        res.status(200).json({
            status:"success",
            message:"caregiver updated successfully",
            data:newCaregiver,
        });

}

exports.deleteCareGiver = async (req,res)=>{
    try {
        const deleteCaregiver=await caregiverServices.deletecaregiver(req.params.id);
        if(!deleteCaregiver){
            res.status(404).json({ status: "error", message: "caregiver not found" });
            return;
        }
        res.status(200).json({
            status:"success",
            message:"caregiver deleted successfully",
            data:deleteCaregiver,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", messag: err.message });
    }
}

exports.deleteallCareGivers =async(req,res)=>{
    try {
        const deleteCaregiver=await caregiverServices.deleteAllCaregivers();
        res.status(200).json({
            status:"success",
            message:"caregiver deleted successfully",
            data:null,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", messag: err.message });
    }
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
 