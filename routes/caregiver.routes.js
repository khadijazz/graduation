const express = require("express");

const router=express.Router();

const controller=require( "../controller/caregiver.controller")


router.post('/',controller.newCaregiver);

router.route('/:id')
.get(controller.getCareGiver)
.patch(controller.updateCareGiver)
.delete(controller.deleteCareGiver)  

router.delete("/",controller.deleteallCareGivers)

module.exports=router;
