const {ApiError}=require("../Utills/ApiError.js");
const bookingService=require("../services/booking.services");

exports.createBooking=async(req,res,next)=>{
const Data=req.body;
const Booking=await bookingService.createBooking(Data);
res.status(201).json({
  message:"booking created successfully",
  success:true,
  data:Booking
})}

exports.getAllBookings=async(req,res,next)=>{
  const Booking=await bookingService.getallbooking(req.query);
  res.status(200).json({
    message:"bookings fetched successfully",
    success:true,
    data:Booking
  })
}

exports.getBookingById=async(req,res,next)=>{
  const Booking=await bookingService.getbookingbyid(req.params.id);
  if(!Booking){
    throw new ApiError("booking with this id does not exist",404);
  }
  res.status(200).json({
    message:"booking retrieved successfully",
    success:true,
    data:Booking
  })
}

exports.updateBooking=async(req,res,next)=>{
  const id=req.params.id;
  const Data = req.body;  
const Booking=await bookingService.updatebooking(id,Data);
  res.status(200).json({
    message:"booking updated successfully",
    success:true,
    data:Booking
  })
}

exports.deleteBooking=async(req,res,next)=>{
  const id=req.params.id;
  const Booking=await bookingService.deletebooking(id);
  res.status(200).json({
    message:"booking deleted successfully",
  })
}

