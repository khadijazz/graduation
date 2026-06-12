const express = require("express");
const router = express.Router();
const controller = require("../controllers/complaint.controller");
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");

router.post("/", verifyUser, permittedTo(["client"]), controller.createComplaint);

module.exports = router;
