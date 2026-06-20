const services = require("../models/services.model");
const { ApiFeature } = require("../Utills/ApiFeature");

const createService = (data) => services.create(data);
const getallservices = async () => {
    return await services.find({});
};
const getservicebyid = (id) => services.findById(id);
const updateservice = (id, updates) => services.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deleteservice = (id) => services.findByIdAndDelete(id);
const deleteAllServices = () => services.deleteMany();
module.exports = { createService, getallservices, getservicebyid, updateservice, deleteservice, deleteAllServices }