const booking=require("../models/booking.model");

exports.createBooking=async(req,res,next)=>{
const Data=req.body;
const Booking=await booking.create(Data);
res.status(201).json({
  message:"booking created successfully",
  success:true,
  data:Booking
})}

exports.getAllBookings=async(req,res,next)=>{
  const Booking=await booking.find({});
  res.status(200).json({
    message:"bookings fetched successfully",
    success:true,
    data:Booking
  })
}

exports.getBookingById=async(req,res,next)=>{
  const Booking=await booking.findById(req.params.id);
  res.status(200).json({
    message:"booking fetched successfully",
    success:true,
    data:Booking
  })
}

exports.updateBooking=async(req,res,next)=>{
  const id=req.params.id;
  const Data = req.body;  
const Booking=await booking.findByIdAndUpdate(id,Data,{new:true,runValidators:true});
  res.status(200).json({
    message:"booking updated successfully",
    success:true,
    data:Booking
  })
}

exports.deleteBooking=async(req,res,next)=>{
  const id=req.params.id;
  const Booking=await booking.findByIdAndDelete(id);
  res.status(200).json({
    message:"booking deleted successfully",
  }),{strict:true}
}
