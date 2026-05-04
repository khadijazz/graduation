const mongoose = require('mongoose');

  const requestSchema = new mongoose.Schema({

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
   service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
   },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED","COMPLETED","CANCELLED"],
      default: "PENDING",
    },
propsed_price: {
  type: Number,
  required: true,
},
    
  } , { timestamps: true });

  const RequestModel = mongoose.model("Request", requestSchema);
  module.exports = { RequestModel };
