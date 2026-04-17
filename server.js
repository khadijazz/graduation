const express = require('express');
const mongoose = require('mongoose');
const app = express();
const morgan = require('morgan');
const caregiverRouter=require("./routes/caregiver.routes");
const userRouter=require("./routes/user.routes");
const servicesRouter=require("./routes/services.router");
const transactionRouter=require("./routes/transaction.router");
const tasksRouter=require("./routes/tasks.routes");

// connected to mongodb
mongoose.connect('mongodb://127.0.0.1:27017/ehtmam').then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
 

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



app.listen(4000, () => {
  console.log('Server is running on port 3000');
});
 
 