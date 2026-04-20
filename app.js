const express = require('express');
const mongoose = require('mongoose');
const app = express();
const morgan = require('morgan');
const caregiverRouter=require("./routes/caregiver.routes");
const userRouter=require("./routes/user.routes");
const servicesRouter=require("./routes/services.router");
const transactionRouter=require("./routes/transaction.router");
const tasksRouter=require("./routes/tasks.routes");
const bookingRouter=require("./routes/booking.router");
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
  res.send('Hello, World!');
});

//logger
app.use(morgan("dev"));

//middleware to parse json body
app.use(express.json({limit:"10mb"}));
//middlware to parse url encoded body
app.use(express.urlencoded({extended:true,limit:"10mb"}));



//middleware of routers
app.use("/caregiver",caregiverRouter);
app.use("/user",userRouter);
app.use("/services",servicesRouter);
app.use("/transaction",transactionRouter);
app.use("/tasks",tasksRouter);
app.use("/booking",bookingRouter);


app.all("{*path}",(req,res,next)=>{
next(new ApiError(`cannot find ${req.originalUrl} on this server!`,404))
})

app.use((error,req,res,next)=>{
  if(error.isOperational){
res.status(error.statusCode).json({
status:"fail",
message:error.message,
data:null
});   
  }else{
    console.log(error);
    res.status(500).json({
      status:"error",
      message:"Internal server error",
      data:null});
  }
})



module.exports=app;
