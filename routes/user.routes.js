const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/user.controller');

router.post('/users' , usercontroller.postuser);
module.exports = router;