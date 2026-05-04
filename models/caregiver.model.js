const mongoose = require("mongoose");

const caregiverSchema = new mongoose.Schema({

  
  role: { type: String },
  price: { type: Number },
  availability: { type: String },
  experience: { type: String },
  profile_picture: { type: String },
    certifications: { type: String },
    verifcation_documents: { type: String },
    isverified: Boolean,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userlog"
    }

}, {
    strict: true
});


const CaregiverModel = mongoose.model("Caregiver", caregiverSchema);
module.exports = CaregiverModel;

