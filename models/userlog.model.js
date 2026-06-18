const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validateAndNormalizeGovernorate } = require("../Utills/governorates");

const addressSchema = new mongoose.Schema({
  
    street: String,
    building: String
});

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

    
      governorate: {
      type: String,
      required: [true, "Governorate is required"],
      validate: {
        validator: function(v) {
          return !!validateAndNormalizeGovernorate(v);
        },
        message: props => `${props.value} is not a valid governorate!`
      },
      set: function(v) {
        return validateAndNormalizeGovernorate(v) || v;
      }
    },
    address : addressSchema,
phoneNumber:{ type: String, unique: true }, 

    active: {
      type: Boolean,
      default: true
    },
    
    role: {
      type: String,
      enum: ["client"],
      default: "client",
    },

 profile_picture: String,
national_id: String,
   isBlocked: {
     type: Boolean,
     default: false
   },
   blockReason: {
     type: String,
     default: null
   },
   blockDate: {
     type: Date,
     default: null
   },
   blockedBy: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "admin",
     default: null
   },
   
  averageRating: {
  type: Number,
  default: 0
},

totalReviewsCount: {
  type: Number,
  default: 0
},
   passwordResetToken: {type: String,default: null},
   passwordResetExpires: {type: Date,default: null},          
   passwordResetAttempts: {type: Number,default: 0},
   wallet: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Wallet",
     default: null
   }

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