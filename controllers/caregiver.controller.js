const caregiver=require("../models/caregiver.model");

exports.newCaregiver=  async (req, res) => {
    try {
        const caregiverData = req.body;
        console.log(req.body);

        const newCaregiver = await caregiver.create(caregiverData); 
        res.status(201).json({
            status: "success",
            message: "caregiver created successfully",
            data: newCaregiver, 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", message: err.message });
    }
}

exports.getCareGiver = async (req,res)=>{
    try {
        const caregiverr=await caregiver.findById(req.params.id);
        if(!caregiverr){
             res.status(404).json({ status: "error", message: "caregiver not found" });
             return;
        }
        res.status(200).json({
            status:"success",
            message:"caregivers retrieved successfully",
            data:caregiverr,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", messag: err.message });
    }
}

exports.updateCareGiver = async (req,res)=>{
    try {
        const updateData=req.body;
        const newCaregiver=await caregiver.findByIdAndUpdate(req.params.id,updateData,{new:true});
        if(!newCaregiver){
             res.status(404).json({ status: "error", message: "caregiver not found" });
             return;
        }
        res.status(200).json({
            status:"success",
            message:"caregiver updated successfully",
            data:newCaregiver,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "error", messag: err.message });
    }
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

