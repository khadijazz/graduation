const express=require("express");
const transactionController=require("../controllers/transaction.controller");
const router=express.Router();



router.route("/")
.post(transactionController.createTransaction)
.get(transactionController.getAllTransactions)
.delete(transactionController.deleteAllTransactions);
router.route("/:id")
.get(transactionController.getOneTransaction)
.patch(transactionController.updateTransaction)
.delete(transactionController.deleteTransaction);


module.exports=router;