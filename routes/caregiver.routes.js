const express = require("express");
const router=express.Router();
const controller=require("../controllers/caregiver.controller")
const verifyUser=require("../Utills/verifyuser")

const {permittedTo} =require("../Utills/premittedTo");


router.route('/')
.get(controller.getallcaregiver)
.delete(controller.deleteallCareGivers)

router.route('/:id')
.get(controller.getCareGiver)
.patch(controller.updateCareGiver)
.delete(permittedTo(["admin"]),controller.deleteCareGiver)  
router.post('/signup',controller.newCaregiver)

module.exports=router;
