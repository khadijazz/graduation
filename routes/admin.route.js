const express = require('express');
const admincontroller = require('../controllers/admin.conroller');
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");
const router = express.Router();

router.post('/createadmin', admincontroller.createadmin);

module.exports = router;