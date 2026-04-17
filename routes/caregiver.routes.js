const express = require("express");

const router=express.Router();

const controller=require( "../controller/caregiver.controller")


router.post('/caregiver',controller.newCaregiver);

router.route('/caregiver/:id')
.get(controller.getCareGiver)
.patch(controller.updateCareGiver)
.delete(controller.deleteCareGiver)  

router.delete("/caregivers",controller.deleteallCareGivers)

module.exports=router;
