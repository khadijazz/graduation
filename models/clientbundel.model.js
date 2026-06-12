const mongoose=require("mongoose");


const clientBundleSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userlog",
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
    enum: ["PENDING", "PAID", "ACTIVE", "CANCELLED", "EXPIRED"],
    default: "PENDING",
  },

  purchaseDate: {
    type: Date,
  },

  expirationDate: {
    type: Date,
  },

  remainingUses: {
    type: Number,
  },

}, { timestamps: true });

module.exports = mongoose.model("ClientBundle", clientBundleSchema);