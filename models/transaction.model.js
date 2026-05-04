const mongoose=require("mongoose");

const transactionSchema=new mongoose.Schema({
    transactionId:{
        type:String,
        required:true,
        unique:true
    },
    amount:{
        type:Number,
        required:true,
        min:0,
        max:10000
    },
    date_of_transaction:{
        type:Date,
        default:Date.now
    },
    payment_method:{
        type:String,
        enum:["cash","card","wallet"],
        required:true
    },
    status:{
        type:String,
        enum:["pending","completed","failed"],
        default:"pending"
    },
    
}, { strict: true,
    timestamps:true
 });

module.exports=mongoose.model("Transaction",transactionSchema);