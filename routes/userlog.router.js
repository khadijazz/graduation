const express = require('express');
const userlogcontroller = require('../controllers/userlog.controller');
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const { upload } = require("../Utills/uploadCloudinary");
router.use((req, res, next) => {
  console.log("METHOD =", req.method);
  console.log("URL =", req.originalUrl);
  next();
}); 
router.post('/signup', upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "national_id", maxCount: 2 },
]), userlogcontroller.createuserlog);

router.post('/login', userlogcontroller.loginUser);
router.post('/forgotpassword', userlogcontroller.forgotPassword);
router.patch('/resetpassword/:token', userlogcontroller.resetPassword);
router.patch('/updatepassword', verifyUser, userlogcontroller.updatePassword);

router.get('/:id', userlogcontroller.finduserlogbyid);
module.exports = router;