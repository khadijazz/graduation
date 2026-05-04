const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const verifyUser=require("../Utills/verifyuser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);

router.route("/")
.post(permittedTo(["client","caregiver"]),reviewController.createReview)
.get(permittedTo(["admin"]),reviewController.getAllReviews);

router.route("/:id")
.get(permittedTo(["client","caregiver","admin"]),reviewController.getReviewById)
.patch(permittedTo(["client","caregiver"]),reviewController.updateReview)
.delete(permittedTo(["client","caregiver","admin"]),reviewController.deleteReview);

module.exports=router;