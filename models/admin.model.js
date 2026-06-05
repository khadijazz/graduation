const mongoose = require("mongoose");

const adminAddressSchema = new mongoose.Schema({
    city: String,
    street: String,
    building: String
});

const adminSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        required: true
    },
    role : {
        type: String,
        default: "admin"
    },
    
    level : {
        type: String,
        enum: ["Super Admin", "Admin"],
        default: "Admin"
    },

    address : adminAddressSchema,
} ,{timestamps : true} )

module.exports = mongoose.model("admin", adminSchema);