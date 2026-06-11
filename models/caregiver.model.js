const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const { validateAndNormalizeGovernorate } = require("../Utills/governorates");

const caregiverSchema = new mongoose.Schema({

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
      select: false
    
    }, 
   passwordConfirmation: {
      type: String,
      trim: true,
      validate:function (value){
      return this.password===value;
      },

    }, 
  role: { type: String ,default:"caregiver"},

phoneNumber:{ type: String, unique: true }, 

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

  active: {
    type: Boolean,
    default: true
  },

  speciality:{type:String, enum:["elderly care","child care","pet care","medical care"]},

  price: { type: Number },
  availability: { type: String },
  experience: { type: String },
  profile_picture: { type: String },
    certifications: [{ type: String }],
    verifcation_documents: [{ type: String }],
     passwordResetToken: String,          
   passwordResetExpires: Date,          
   passwordResetAttempts: {             
      type: Number
     
    },

}, {
  timestamps: true,
});
caregiverSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.passwordConfirmation = undefined;
  this.password = await bcrypt.hash(this.password, 10);
});
caregiverSchema.post("find*",function(result){
result.password=undefined;
})


caregiverSchema.methods.createPasswordResetToken = function () {
  
  const resetToken = crypto.randomBytes(10).toString("hex");
 
  
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
 
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
 
  
  this.passwordResetAttempts = 0;
 
  
  return resetToken;
};



const CaregiverModel = mongoose.model("Caregiver", caregiverSchema);
module.exports = CaregiverModel;

