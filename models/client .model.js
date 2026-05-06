const mongoose=require("mongoose");

const clientSchema=new mongoose.Schema({
    user: {type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    name: {type:String,required:true},
    email: {type:String,required:true},
    phone: {type:String,required:true},
    address: {type:String,required:true},
    rated: {type:Number,default:0},
    
})

module.exports = mongoose.model("Client", clientSchema);
