const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const {ApiFeatures}=require("../Utills/ApiFeature")

const getMyWalletService = async (userId) => {
    const wallet = await Wallet.findOne({ user: userId });
    
};

const getWalletBalance = async (userId) => {

  const wallet = await Wallet.findOne({
    user: userId
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet;
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
  getWalletBalance,
    depositService,
};  