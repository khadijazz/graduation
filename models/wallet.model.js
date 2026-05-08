const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userlog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Userlog",
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
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
        default: [],
        ref: "Transaction",
    },
    update_at: {
        type: Date,
        default: Date.now,
    },
   
} , {timestamps: true})

module.exports = mongoose.model("Wallet", walletSchema);