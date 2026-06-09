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
 },
 notes:{
    type:String,
 },
 status:{
    type:String,
    default:"pending",
    enum:["pending","accepted","rejected"],

 },


 
}, {
  timestamps: true,
});



const offerModel = mongoose.model("Offer", offerSchema);
module.exports = offerModel;