const express = require('express');
const userlogcontroller = require('../controllers/userlog.controller');
const router = express.Router();
<<<<<<< HEAD
const verifyUser=require("../Utills/verifyUser");
=======
const verifyUser = require("../Utills/verifyUser");
const { upload } = require("../Utills/uploadCloudinary");
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1

router.post('/signup',upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "national_id", maxCount: 2 },
  ]),userlogcontroller.createuserlog);
router.post('/login',userlogcontroller.loginUser);
router.get('/:id',userlogcontroller.finduserlogbyid);
router.post('/forgotpassword', userlogcontroller.forgotPassword);
router.patch('/resetpassword/:token', userlogcontroller.resetPassword);
router.patch('/updatepassword',verifyUser, userlogcontroller.updatePassword);
module.exports = router;