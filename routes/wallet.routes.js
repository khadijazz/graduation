const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const {pmtied}=require("../Utills/premtied");
const verfiyusers = require("../Utills/verfiyusers");
router.use(verfiyusers);

router.route("/")
.post(pmtied(["client","caregiver"]),walletController.createWallet)
.get(pmtied(["admin"]),walletController.getAllWallet);

router.route("/:id")
.get(pmtied(["client","caregiver","admin"]),walletController.getWalletById)
.patch(pmtied(["client","caregiver"]),walletController.updateWallet)
.delete(pmtied(["client","caregiver","admin"]),walletController.deleteWallet);

module.exports=router;