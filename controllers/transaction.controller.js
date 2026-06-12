const transactionServices = require("../services/transaction.services");
const {ApiError}=require("../Utills/ApiError");

exports.createTransaction=async (req,res,next)=>{
const Data=req.body;
const service=await transactionServices.createTransaction(Data);
res.status(201).json({
    status:"success",
    data:service
})
}
exports.getAllTransactions=async (req,res,next)=>{
const txns=await transactionServices.getalltransaction(req.query);

const enriched = txns.map(txn => {
  const plainTxn = txn.toObject ? txn.toObject() : txn;
  
  let clientName = "";
  if (plainTxn.booking && plainTxn.booking.client) {
    clientName = plainTxn.booking.client.full_name || "";
  } else if (plainTxn.bundleUsed && plainTxn.bundleUsed.client) {
    clientName = plainTxn.bundleUsed.client.full_name || "";
  } else if (plainTxn.userlog && plainTxn.ownerModel === "Userlog") {
    clientName = plainTxn.userlog.full_name || "";
  }

  let caregiverName = undefined;
  if (plainTxn.booking && plainTxn.booking.caregiver) {
    caregiverName = plainTxn.booking.caregiver.full_name || undefined;
  } else if (plainTxn.userlog && plainTxn.ownerModel === "Caregiver") {
    caregiverName = plainTxn.userlog.full_name || undefined;
  }

  let serviceName = undefined;
  if (plainTxn.booking && plainTxn.booking.request && plainTxn.booking.request.service) {
    serviceName = plainTxn.booking.request.service.serviceName || undefined;
  }

  let bundleName = undefined;
  if (plainTxn.bundleUsed && plainTxn.bundleUsed.bundle) {
    bundleName = plainTxn.bundleUsed.bundle.bundle_name || undefined;
  }

  return {
    ...plainTxn,
    transactionId: plainTxn._id,
    transactionType: plainTxn.type,
    transactionStatus: plainTxn.status,
    amount: plainTxn.amount,
    description: plainTxn.description || "",
    clientName,
    caregiverName,
    serviceName,
    bundleName,
    paymentMethod: plainTxn.paymentMethod || "CARD",
    transactionDate: plainTxn.createdAt
  };
});

res.status(200).json({
    status:"success",
    data: enriched
})
}
exports.getOneTransaction=async (req,res,next)=>{
const service=await transactionServices.gettransactionbyid(req.params.id);
if(!service){
    throw new ApiError("transaction not found",404);
}
res.status(200).json({
    status:"success",
    data:service
})
}
exports.updateTransaction=async (req,res,next)=>{
const service=await transactionServices.updatetransaction(req.params.id,req.body);
res.status(200).json({
    status:"success",
    data:service
})
}
exports.deleteTransaction=async (req,res,next)=>{
const service=await transactionServices.deletetransaction(req.params.id);
res.status(200).json({
    status:"success",
    data:service
})
}
exports.deleteAllTransactions=async (req,res,next)=>{
const service=await transactionServices.deleteAllTransactions();
res.status(200).json({
    status:"success",
    data:null
})
}