const caregiverServices = require("../services/caregiver.services");
const {ApiError}=require("../Utills/ApiError");

exports.newCaregiver=  async (req, res) => {
  
        const caregiverData = req.body;
        const caregiver = await caregiverServices.createcaregiver(caregiverData); 
        res.status(201).json({
            status: "success",
            message: "caregiver created successfully",
            data: caregiver, 
        });
}

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

