const express=require("express");
const router=express.Router();
const clientBundleController=require("../controllers/clientbundel.controller");
const verifyUser=require("../Utills/verifyUser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);


router.get("/all",clientBundleController.getallbundle);


router.get("/:id",permittedTo(["client","admin"]),clientBundleController.getBundleById)
router.post("/payBundle/:id",permittedTo(["client"]),clientBundleController.payBundle)
router.delete("/cancelBundle/:id",permittedTo(["client"]),clientBundleController.cancelBundle);

module.exports=router;
