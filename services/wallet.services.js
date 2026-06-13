const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const { createNotification } = require("./notification.services");
const Userlog = require("../models/userlog.model");
const Caregiver = require("../models/caregiver.model");

const getMyWalletService = async (userId) => {
    const wallet = await Wallet.findOne({ user: userId });
    return wallet;
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

 
  const transaction = await Transaction.create({
    user: userId,
    wallet: wallet._id,
    type: "DEPOSIT",
    amount,
    status: "COMPLETED",
  });

  let user = await Userlog.findById(userId);
  let role = "client";
  if (!user) {
    user = await Caregiver.findById(userId);
    role = "caregiver";
  }

  await createNotification({
    recipientId: userId,
    recipientRole: role,
    notificationType: "WALLET_RECHARGED",
    title: "Wallet Recharge",
    message: "Your wallet has been recharged successfully.",
    relatedEntityId: transaction._id,
    relatedEntityType: "Transaction"
  });

  return wallet;
};


module.exports = {
  getMyWalletService,
  getWalletBalance,
    depositService,
  

};  