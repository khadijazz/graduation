const express=require("express");
const router=express.Router();
const clientBundleController=require("../controllers/clientbundel.controller");
const verfiyusers=require("../Utills/verfiyusers");
const {pmtied}=require("../Utills/premtied");
router.use(verfiyusers);


router.route("/")
.post(pmtied(["client"]),clientBundleController.chooseBundle)
.get(clientBundleController.getallbundle);

router.route("/:id")
.get(pmtied(["client","admin"]),clientBundleController.getBundleById)
.patch(pmtied(["client"]),clientBundleController.payBundle)
.delete(pmtied(["client"]),clientBundleController.cancelBundle);

module.exports=router;
