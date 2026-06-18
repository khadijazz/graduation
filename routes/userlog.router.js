const express = require('express');
const userlogcontroller = require('../controllers/userlog.controller');
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");
const { upload } = require("../Utills/uploadCloudinary");

router.post('/signup', upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "national_id", maxCount: 2 },
]), userlogcontroller.createuserlog);

router.post('/login', userlogcontroller.loginUser);
router.post('/forgotpassword', userlogcontroller.forgotPassword);
router.get('/reset-password/:token', userlogcontroller.openResetPassword);
router.patch('/resetpassword/:token', userlogcontroller.resetPassword);
router.patch('/updatepassword', verifyUser, userlogcontroller.updatePassword);
router.delete('/delete_me', verifyUser, permittedTo(["client"]),userlogcontroller.deleteuserlog);
router.get('/allusers',verifyUser, permittedTo(["admin"]),userlogcontroller.getallusers);
router.get('/:id', userlogcontroller.finduserlogbyid);

module.exports = router;