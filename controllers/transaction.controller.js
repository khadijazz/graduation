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
const service=await transactionServices.getalltransaction(req.query);
res.status(200).json({
    status:"success",
    data:service
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