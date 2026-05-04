const express = require("express");
const router=express.Router();
const controller=require("../controllers/caregiver.controller")
const verifyUser=require("../Utills/verifyuser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);

router.route('/')
.post(controller.newCaregiver)
.get(controller.getallcaregiver)
.delete(permittedTo(["admin"]),controller.deleteallCareGivers)

router.route('/:id')
.get(controller.getCareGiver)
.patch(controller.updateCareGiver)
.delete(permittedTo(["admin"]),controller.deleteCareGiver)  


module.exports=router;
