const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const verfiyusers = require("../Utills/verfiyusers");
const {pmtied}=require("../Utills/premtied");
router.use(verfiyusers);

router.route("/")
.post(pmtied(["client","caregiver"]),reviewController.createReview)
.get(pmtied(["admin"]),reviewController.getAllReviews);

router.route("/:id")
.get(pmtied(["client","caregiver","admin"]),reviewController.getReviewById)
.patch(pmtied(["client","caregiver"]),reviewController.updateReview)
.delete(pmtied(["client","caregiver","admin"]),reviewController.deleteReview);

module.exports=router;