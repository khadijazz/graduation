const express = require('express');
const userlogcontroller = require('../controllers/userlog.controller');
const router = express.Router();
const verifyUser=require("../Utills/verifyUser");

router.post('/signup',userlogcontroller.createuserlog);
router.post('/login',userlogcontroller.loginUser);
router.get('/:id',userlogcontroller.finduserlogbyid);
router.post('/forgotpassword', userlogcontroller.forgotPassword);
router.patch('/resetpassword/:token', userlogcontroller.resetPassword);
router.patch('/updatepassword',verifyUser, userlogcontroller.updatePassword);
module.exports = router;