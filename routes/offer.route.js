const express = require("express");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const offerController = require("../controllers/offer.controller");
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser)

router.route("/:requestId/offer")
  .post(permittedTo(["caregiver"]), offerController.createOffer);


router.route("/:id")
.delete(permittedTo(["caregiver"]), offerController.deleteOffer);


router.route("/:offerId/respond")
  .patch(permittedTo(["client"]), offerController.respondToOffer);
module.exports = router;