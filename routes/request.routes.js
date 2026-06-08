const express = require("express");
const router = express.Router();
const requestController = require("../controllers/request.controller");
const offerController = require("../controllers/offer.controller");
const verifyUser=require("../Utills/verifyUser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);

router.route("/")
.post(permittedTo(["client"]),requestController.createRequest)
.get(permittedTo(["client"]),requestController.getMyRequests);

router.route("/:requestId/offers").get(permittedTo(["client"]),offerController.getOffers);

router.get("/available",permittedTo(["caregiver"]),requestController.getAvailableRequests);

 router.route("/:id/respond")
   .post(permittedTo(["caregiver"]), requestController.respondToRequest);
router.route("/:id")
.get(permittedTo(["client","caregiver","admin"]),requestController.getrequestbyid)
.patch(permittedTo(["client","caregiver","admin"]),requestController.updateRequest)
.delete(permittedTo(["client","caregiver","admin"]),requestController.deleterequest);

module.exports=router;
