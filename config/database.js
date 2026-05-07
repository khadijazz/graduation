const mongoose = require('mongoose');

const connectDB=async()=>{
const uri=process.env.MONGODB_URI;
mongoose.set('strictQuery',true);
await mongoose.connect(uri);
}
module.exports={connectDB};