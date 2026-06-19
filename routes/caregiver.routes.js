const express = require("express");
const router = express.Router();
const controller = require("../controllers/caregiver.controller");
const verifyUser = require("../Utills/verifyUser");
const { upload } = require("../Utills/uploadCloudinary"); 

const {permittedTo} =require("../Utills/premittedTo");


router.route('/')
.get(verifyUser, permittedTo(["admin"]),controller.getallcaregiver)


router.route('/:id')
.get(controller.getCareGiver)
.patch(controller.updateCareGiver)
.delete(permittedTo(["admin"]),controller.deleteCareGiver)  
router.post('/signup',upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "certifications", maxCount: 5 },
    { name: "verification_documents", maxCount: 5 },
    { name: "mental_health_document", maxCount: 1 },
     { name: "national_id", maxCount: 2 }
  ]),controller.newCaregiver)


module.exports=router;

