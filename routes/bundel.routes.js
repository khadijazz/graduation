const express=require("express");
const router=express.Router();
const bundleController=require("../controllers/bundel.controller");
const {permittedTo}=require("../Utills/premittedTo");
const verifyUser = require("../Utills/verifyUser");
router.use(verifyUser);


router.post("/create_bundle",permittedTo(["admin"]),bundleController.createBundle);
router.get("/get-all-bundle",permittedTo(["client","admin"]), bundleController.getAllBundle)
router.patch("/update_bundle/:id",permittedTo(["admin"]),bundleController.updateBundle)
router.delete("/delete_bundle/:id",permittedTo(["admin"]),bundleController.deletebundle);

module.exports=router;