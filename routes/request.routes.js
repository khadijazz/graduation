const express = require("express");
const router = express.Router();
const requestController = require("../controllers/request.controller");
const verifyUser=require("../Utills/verifyuser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);

router.route("/")
.post(permittedTo(["client"]),requestController.createRequest)
.get(requestController.getAllRequests);

router.route("/:id")
.get(permittedTo(["client","caregiver","admin"]),requestController.getRequestById)
.patch(permittedTo(["client","caregiver","admin"]),requestController.updateRequest)
.delete(permittedTo(["client","caregiver","admin"]),requestController.deleteRequest);

module.exports=router;
