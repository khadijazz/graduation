const mongoose = require('mongoose');

const connectDB=async()=>{
const uri=process.env.MONGODB_URI || "mongodb://youssefelsheikh24_db:0101005$$NEWgrad@ac-fzionly-shard-00-00.z8d9jdk.mongodb.net:27017,ac-fzionly-shard-00-01.z8d9jdk.mongodb.net:27017,ac-fzionly-shard-00-02.z8d9jdk.mongodb.net:27017/ehtmam?ssl=true&replicaSet=atlas-y6b8uh-shard-0&authSource=admin&appName=ehtmam-db";
mongoose.set('strictQuery',true);
await mongoose.connect(uri);
}
module.exports={connectDB};