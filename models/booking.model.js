const mongoose=require("mongoose");

const bookingSchema=new mongoose.Schema({
    BookingId:{
        type:Number,
        required:true,
        unique:true
    },
    BookingStatus:{
        type:String,
        required:true,
        enum:["pending","confirmed","cancelled"],
        default:"pending"
    },
    StartTime:{
        type:Date,
        default:Date.now
    },
    EndTime:{
        type:Date,
        default:Date.now
    },
    
}, { strict: true });



module.exports=mongoose.model("Booking",bookingSchema);