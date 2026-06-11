const mongoose=require("mongoose");

const bundleSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog"
  },
  caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Caregiver"
  },
  price: {
    type: Number,
    required: true
  },
  discount: Number,
  bundle_name: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  sessions:Number,
  validity:String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Bundle", bundleSchema);