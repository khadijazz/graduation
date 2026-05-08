const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const {ApiFeatures}=require("../Utills/ApiFeature")

const getMyWalletService = async (req, res, next) => {
    const wallet = await Wallet.findOne({ user: req.user._id });
    res.status(200).json({
        message: "Wallet fetched successfully",
        data: wallet,
    });
};


const depositService = async (userId, amount) => {
  
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }


  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    throw new Error("Wallet not found");
  }


  wallet.balance += amount;
  wallet.totalDeposited += amount;
  wallet.lastTransactionAt = new Date();

  await wallet.save();

 
  await Transaction.create({
    user: userId,
    wallet: wallet._id,
    type: "DEPOSIT",
    amount,
    status: "COMPLETED",
  });

  return wallet;
};


module.exports = {
  getMyWalletService,
    depositService,
};  