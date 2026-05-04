const transaction=require("../models/transaction.model");
const {ApiError}=require("../Utills/ApiError");
const {ApiFeature}=require("../Utills/ApiFeature.js");

const createTransaction = (data) => transaction.create(data);
const getalltransaction = (queryParams) =>{
    const apiFeature=new ApiFeature(transaction.find({}),queryParams);
    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();
    return apiFeature.dbQuery;
};
const gettransactionbyid = (id) => transaction.findById(id);
if(!gettransactionbyid){
    throw new ApiError("transaction not found",404);
}
const updatetransaction = (id, updates) => transaction.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deletetransaction = (id) => transaction.findByIdAndDelete(id);
const deleteAllTransactions = () => transaction.deleteMany({});
module.exports={createTransaction,getalltransaction,gettransactionbyid,updatetransaction,deletetransaction,deleteAllTransactions}