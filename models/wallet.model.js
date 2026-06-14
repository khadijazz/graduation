const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userlog: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "ownerModel",
        required: true,
        unique: true,
      
    },
    ownerModel: {
        type: String,
        required: true,
        enum: ["Userlog", "Caregiver"],
        default: "Userlog"
    },
    balance: {
        type: Number,
        default: 0,
     
    },
    holdBalance: {
        type: Number,
        default: 0,
        
    },
    totalEarned: {
        type: Number,
        default: 0
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
   
} , {
    timestamps: true,
  
})

walletSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'updateOne', 'deleteMany', 'deleteOne'], function() {
  this.setQuery(this.model.translateAliases(this.getQuery()));
});

module.exports = mongoose.model("Wallet", walletSchema);