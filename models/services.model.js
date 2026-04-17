const mongoose=require("mongoose");

const servicesSchema=new mongoose.Schema({
    serviceID:{type: Number,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 5},

    serviceName:{ type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true},
    serviceDescription:{ type: String,
        trim: true,
        minlength: 3,
        maxlength: 255,
        required: true},
},{strict:true})

module.exports=mongoose.model("services",servicesSchema);