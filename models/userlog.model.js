const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
<<<<<<< HEAD

const addressSchema = new mongoose.Schema({
    city: String,
    street: String,
    building: String
});
=======
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1

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

    address : addressSchema,
    
    role: {
      type: String,
      enum: ["client"],
      default: "client",
    },
<<<<<<< HEAD
=======
 profile_picture: String,
national_id: String,

>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1
   passwordResetToken: {type: String,default: null},
   passwordResetExpires: {type: Date,default: null},          
   passwordResetAttempts: {type: Number,default: 0}

} , 
{ timestamps: true });


userlogSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.passwordConfirmation = undefined;
  this.password = await bcrypt.hash(this.password, 10);
});
userlogSchema.post("find*",function(result){
result.password=undefined;
})

userlogSchema.methods.createPasswordResetToken = function () {
<<<<<<< HEAD
  // 1) Plain token → goes inside the email link (never stored in DB)
  const resetToken = crypto.randomBytes(10).toString("hex");
 
  // 2) Hashed token → stored in DB (useless to a hacker without the plain one)
=======
  const resetToken = crypto.randomBytes(10).toString("hex");
 
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
 
<<<<<<< HEAD
  // 3) Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
 
  // 4) Reset attempt counter for this fresh token
  this.passwordResetAttempts = 0;
 
  // 5) Return the PLAIN token (the one that goes in the email URL)
=======
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
 
  this.passwordResetAttempts = 0;
 
 
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1
  return resetToken;
};

 module.exports= mongoose.model('Userlog', userlogSchema);

 