const express=require("express");
const router=express.Router();
const clientBundleController=require("../controllers/clientbundel.controller");
const verifyUser=require("../Utills/verifyUser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);


router.route("/")
.post(permittedTo(["client"]),clientBundleController.chooseBundle)
.get(clientBundleController.getallbundle);

router.route("/:id")
.get(permittedTo(["client","admin"]),clientBundleController.getBundleById)
.patch(permittedTo(["client"]),clientBundleController.payBundle)
.delete(permittedTo(["client"]),clientBundleController.cancelBundle);

module.exports=router;
