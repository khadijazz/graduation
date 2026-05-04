const mongoose=require("mongoose");


const clientBundleSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  bundle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bundle",
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["PENDING", "PAID", "ACTIVE", "CANCELLED"],
    default: "PENDING",
  },

}, { timestamps: true });

module.exports = mongoose.model("ClientBundle", clientBundleSchema);