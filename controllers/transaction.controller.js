const trasnaction=require("../models/transaction.model");

exports.createTransaction=async (req,res,next)=>{
const Data=req.body;
const service=await trasnaction.create(Data);
res.status(201).json({
    status:"success",
    data:service
})
}
exports.getAllTransactions=async (req,res,next)=>{
const service=await trasnaction.find();
res.status(200).json({
    status:"success",
    data:service
})
}
exports.getOneTransaction=async (req,res,next)=>{
const service=await trasnaction.findById(req.params.id);
res.status(200).json({
    status:"success",
    data:service
})
}
exports.updateTransaction=async (req,res,next)=>{
const service=await trasnaction.findByIdAndUpdate(req.params.id,req.body,{new:true});
res.status(200).json({
    status:"success",
    data:service
})
}
exports.deleteTransaction=async (req,res,next)=>{
const service=await trasnaction.findByIdAndDelete(req.params.id);
res.status(200).json({
    status:"success",
    data:service
})
}
exports.deleteAllTransactions=async (req,res,next)=>{
const service=await trasnaction.deleteMany();
res.status(200).json({
    status:"success",
    data:service
})
}