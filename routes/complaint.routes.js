const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaint.controller");
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");

router.use(verifyUser);

router.post("/:bookingId", permittedTo(["client"]), complaintController.createComplaint);
router.get("/:complaintId", permittedTo(["client", "caregiver", "admin"]), complaintController.getComplaintDetails);
router.get("/", permittedTo(["admin"]), complaintController.getAllComplaints);

module.exports = router;
