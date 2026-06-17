const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaint.controller");
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");

router.post("/:bookingId", verifyUser, permittedTo(["client"]), complaintController.createComplaint);

module.exports = router;
