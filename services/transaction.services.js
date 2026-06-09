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
const gettransactionbyid = async (id) => {
    const txn = await transaction.findById(id);
    if (!txn) {
        throw new ApiError("transaction not found", 404);
    }
    return txn;
};
const updatetransaction = (id, updates) => transaction.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deletetransaction = (id) => transaction.findByIdAndDelete(id);
const deleteAllTransactions = () => transaction.deleteMany({});
module.exports={createTransaction,getalltransaction,gettransactionbyid,updatetransaction,deletetransaction,deleteAllTransactions}