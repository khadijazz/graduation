const services=require("../models/services.model");

exports.createService=async (req,res,next)=>{
const Data=req.body;
const service=await services.create(Data);
res.status(201).json({
    status:"success",
    data:service
})
}

exports.getAllServices=async (req,res,next)=>{
    const Services=await services.find({});
    res.status(200).json({
        status:"success",
        data:Services
    })
}

exports.getService=async (req,res,next)=>{
    const Service=await services.findById(req.params.id);
    res.status(200).json({
        status:"success",
        data:Service
    })
}

exports.updateService=async (req,res,next)=>{
    const Service=await services.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});
    res.status(200).json({
        status:"success",
        data:Service
    })
}

exports.deleteService=async (req,res,next)=>{
    const Service=await services.findByIdAndDelete(req.params.id);
    res.status(200).json({
        status:"success",
        data:Service
    })
}

exports.deletAllServices=async (req,res,next)=>{
    const Services=await services.deleteMany({});
    res.status(200).json({
        status:"success",
        data:Services
    })
}