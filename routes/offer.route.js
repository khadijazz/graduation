const express = require("express");
const router = express.Router();
const verifyUser = require("../Utills/verifyuser");
const offerController = require("../controllers/offer.controller");
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser)

router.route("/create")
.post(permittedTo(["caregiver"]), offerController.createOffer);


router.route("/:id")
.delete(permittedTo(["caregiver"]), offerController.deleteOffer);


module.exports = router;