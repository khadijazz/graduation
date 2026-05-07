const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
 request:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Request"
 },
 caregiver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Caregiver"
 },
 price:{
    type:Number,
    required:true
 },
 notes:{
    type:String,
 },
 status:{
    type:String,
    enum:["pending","accepted","rejected"],
    default:"pending"
 },


 
}, {
  timestamps: true,
});



const offerModel = mongoose.model("offer", offerSchema);
module.exports = offerModel;