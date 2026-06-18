const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const verifyUser = require("../Utills/verifyUser")
const { permittedTo } = require("../Utills/premittedTo");
router.use(verifyUser);

router.post("/create_review/:bookingId", permittedTo(["client","caregiver"]), reviewController.createReview)
router.get("/getAllReviews",permittedTo(["admin"]), reviewController.getAllReviews);


router.get("/my-reviews",permittedTo(["caregiver","client"]), reviewController.getMyReviews);


router.get("/:id",permittedTo(["client","caregiver","admin"]),reviewController.getReviewById)
router.patch("/:id",permittedTo(["client"]),reviewController.updateReview)
router.delete("/:id",permittedTo(["client"]),reviewController.deleteReview);

module.exports=router;