const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userlog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userlog",
        required: true,
    },
    balance: {
        type: Number,
        required: true,
    },
     totalDeposited: {
    type: Number,
    default: 0,
  },

  totalSpent: {
    type: Number,
    default: 0,
  },
    transactions: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Transaction",
    },
    update_at: {
        type: Date,
        default: Date.now,
    },
   
} , {timestamps: true})

module.exports = mongoose.model("Wallet", walletSchema);