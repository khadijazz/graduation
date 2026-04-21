const caregiver=require("../models/caregiver.model");

exports.newCaregiver=  async (req, res) => {
  
        const caregiverData = req.body;
        console.log(req.body);

        const newCaregiver = await caregiver.create(caregiverData); 
        res.status(201).json({
            status: "success",
            message: "caregiver created successfully",
            data: newCaregiver, 
        });
}

exports.getCareGiver = async (req,res)=>{
    
        const caregiverr=await caregiver.findById(req.params.id);
        if(!caregiverr){
            throw new ApiError("caregiver not found",404)
        }
        res.status(200).json({
            status:"success",
            message:"caregivers retrieved successfully",
            data:caregiverr,
        });
}

exports.updateCareGiver = async (req,res)=>{
    
        const updateData=req.body;
        const newCaregiver=await caregiver.findByIdAndUpdate(req.params.id,updateData,{new:true});
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
        const deleteCaregiver=await caregiver.findByIdAndDelete(req.params.id);
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
        await caregiver.deleteMany();
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

