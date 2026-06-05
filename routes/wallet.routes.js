const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const verifyUser=require("../Utills/verifyUser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);

router.route("/")
.get(permittedTo(["client","caregiver"]),walletController.getWalletBalance)

router.route("/:id")
.get(permittedTo(["client","caregiver","admin"]),walletController.getWalletById)
.patch(permittedTo(["client","caregiver"]),walletController.updateWallet)
.delete(permittedTo(["client","caregiver","admin"]),walletController.deleteWallet);

module.exports=router;