const express=require("express");
const router=express.Router();
const bundleController=require("../controllers/bundle.controller");
const {pmtied}=require("../Utills/premtied");
const verfiyusers = require("../Utills/verfiyusers");
router.use(verfiyusers);


router.route("/")
.post(pmtied(["admin"]),bundleController.createBundle)
.get(bundleController.getallbundle);

router.route("/:id")
.get(bundleController.getbundlebyid)
.patch(pmtied(["admin"]),bundleController.updatebundle)
.delete(pmtied(["admin"]),bundleController.deletebundle);

module.exports=router;