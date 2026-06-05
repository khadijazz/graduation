const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const verifyUser = require("../Utills/verifyuser");
=======
const verifyUser = require("../Utills/verifyUser");
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1
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