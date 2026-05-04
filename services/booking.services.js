const booking = require("../models/booking.model");
const { ApiFeature } = require("../Utills/ApiFeature");

const createBooking = (data) => booking.create(data);
const getallbooking = (queryParams) =>{
    const apiFeature=new ApiFeature(booking.find({}),queryParams);
    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();
    return apiFeature.dbQuery;
};
const getbookingbyid = (id) => booking.findById(id);
const updatebooking = (id, updates) => booking.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deletebooking = (id) => booking.findByIdAndDelete(id);


module.exports={createBooking,getallbooking,getbookingbyid,updatebooking,deletebooking}