const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
      enum: ["client"],
      default: "client",
    },
 profile_picture: String,
national_id: String,

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
  const resetToken = crypto.randomBytes(10).toString("hex");
 
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
 
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
 
  this.passwordResetAttempts = 0;
 
 
  return resetToken;
};

 module.exports= mongoose.model('Userlog', userlogSchema);

 