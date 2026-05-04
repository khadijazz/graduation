const services=require("../models/services.model");
const { ApiFeature } = require("../Utills/ApiFeature");

const createService = (data) => services.create(data);
const getallservices = (queryParams) =>{
    const apiFeature=new ApiFeature(services.find({}),queryParams);
    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();
    return apiFeature.dbQuery;
};
const getservicebyid = (id) => services.findById(id);
const updateservice = (id, updates) => services.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deleteservice = (id) => services.findByIdAndDelete(id);
const deleteAllServices = () => services.deleteMany();
module.exports={createService,getallservices,getservicebyid,updateservice,deleteservice,deleteAllServices}