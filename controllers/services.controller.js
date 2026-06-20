const servicesServices = require("../services/services.services");
const { ApiError } = require("../Utills/ApiError");

exports.createService = async (req, res, next) => {
    const Data = req.body;
    const service = await servicesServices.createService(Data);
    res.status(201).json({
        status: "success",
        data: service
    })
}

exports.getAllServices=async (req,res,next)=>{
    const Services=await servicesServices.getallservices();
    res.status(200).json({
        status:"success",
       result:Services.length,
        data:Services
    })
}

exports.getService=async (req,res,next)=>{
    const id =req.params.id;
     const Service=await servicesServices.getservicebyid(id);
     if(!Service){
      throw new ApiError("service not found",404);
     }
    res.status(200).json({
        status:"success",
        data:Service
    })
}

exports.updateService=async (req,res,next)=>{
    const id =req.params.id;
    const Data = req.body;
    const Service=await servicesServices.updateservice(id,Data);
    res.status(200).json({
        status:"success",
        data:Service
    })
}

exports.deleteService=async (req,res,next)=>{
    const id =req.params.id;
    const Service=await servicesServices.deleteservice(id);
    res.status(200).json({
        status:"success",
        data:Service
    })
}

exports.deletAllServices=async (req,res,next)=>{
    const Services=await servicesServices.deleteAllServices();
    res.status(200).json({
        status:"success",
        data:Services
    })
}