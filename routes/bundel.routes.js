const express=require("express");
const router=express.Router();
const bundleController=require("../controllers/bundel.controller");
const {permittedTo}=require("../Utills/premittedTo");
const verifyUser = require("../Utills/verifyUser");
router.use(verifyUser);


router.route("/")
.post(permittedTo(["admin"]),bundleController.createBundle)
.get(bundleController.getallbundle);

router.route("/:id")
.get(bundleController.getbundlebyid)
.patch(permittedTo(["admin"]),bundleController.updatebundle)
.delete(permittedTo(["admin"]),bundleController.deletebundle);

module.exports=router;