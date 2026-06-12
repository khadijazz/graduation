const express=require("express");
const transactionController=require("../controllers/transaction.controller");
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");
const router=express.Router();

router.use(verifyUser);
router.post("/",transactionController.createTransaction)
router.get("/all_transactions",permittedTo(["admin"]), transactionController.getAllTransactions)
router.delete("/all_transactions",permittedTo(["admin"]),transactionController.deleteAllTransactions);
router.route("/:id")
.get(transactionController.getOneTransaction)
.patch(transactionController.updateTransaction)
.delete(transactionController.deleteTransaction);


module.exports=router;