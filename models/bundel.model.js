const mongoose=require("mongoose");

const bundleSchema=new mongoose.Schema({
    client: {type:mongoose.Schema.Types.ObjectId,ref:"Userlog",required:true},
    caregiver: {type:mongoose.Schema.Types.ObjectId,ref:"Caregiver",required:true},
    services: {type:[mongoose.Schema.Types.ObjectId],ref:"Service",required:true},
    price: {type:Number,required:true},
    discount: {type:Number},
    totalPrice: {type:Number,required:true},
    
})

module.exports = mongoose.model("Bundle", bundleSchema);