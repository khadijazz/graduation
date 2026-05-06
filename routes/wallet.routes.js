const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const verifyUser=require("../Utills/verifyUser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);

router.route("/")
.post(permittedTo(["client","caregiver"]),walletController.createWallet)
.get(permittedTo(["admin"]),walletController.getAllWallet);

router.route("/:id")
.get(permittedTo(["client","caregiver","admin"]),walletController.getWalletById)
.patch(permittedTo(["client","caregiver"]),walletController.updateWallet)
.delete(permittedTo(["client","caregiver","admin"]),walletController.deleteWallet);

module.exports=router;