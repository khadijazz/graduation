const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    balance: {
        type: Number,
        required: true,
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