const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userlogSchema = new mongoose.Schema({
  full_name:{
    type: String,
    required: true,
  }, 
  email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: v => v.replace(/\s+/g, '')
    },
    password: {
      type: String,
     trim: true,
      required: true,
    
    }, 
   passwordConfirmation: {
      type: String,
      trim: true,
      validate:function (value){
      return this.password===value;
      },

    }, 

    role: {
      type: String,
      enum: ["client", "caregiver", "admin"],
      default: "client",
    },

} , 
{ timestamps: true });

 userlogSchema.pre("save",async function(){
  if(this.isNew)
    this.passwordConfirmation=undefined;
  this.password= await bcrypt.hash(this.password,10)
}) ;
userlogSchema.post("find*",function(result){
result.password=undefined;
})

 module.exports= mongoose.model('Userlog', userlogSchema);

 