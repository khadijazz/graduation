const express = require("express");
const router=express.Router();
const controller=require("../controllers/caregiver.controller")

router.route('/')
.post(controller.newCaregiver)
.delete(controller.deleteallCareGivers)

router.route('/:id')
.get(controller.getCareGiver)
.patch(controller.updateCareGiver)
.delete(controller.deleteCareGiver)  


module.exports=router;
