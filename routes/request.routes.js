const express = require("express");
const router = express.Router();
const requestController = require("../controllers/request.controller");
const verfiyusers = require("../Utills/verfiyusers");
const {pmtied}=require("../Utills/premtied");
router.use(verfiyusers);

router.route("/")
.post(pmtied(["client"]),requestController.createRequest)
.get(requestController.getAllRequests);

router.route("/:id")
.get(pmtied(["client","caregiver","admin"]),requestController.getRequestById)
.patch(pmtied(["client","caregiver","admin"]),requestController.updateRequest)
.delete(pmtied(["client","caregiver","admin"]),requestController.deleteRequest);

module.exports=router;
