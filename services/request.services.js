
const requestModel = require("../models/request.model");


exports.createRequestService = async (req, res, next) => {
    const {client,caregiver,service,location,date,time,duration,notes,status,propsed_price} = req.body;
    const request = await requestModel.create({client,caregiver,service,location,date,time,duration,notes,status,propsed_price});
    res.status(201).json({
        message: "Request created successfully",
        data: request,
    });
};
