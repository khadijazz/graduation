const express = require('express');
const userlogcontroller = require('../controllers/userlog.controller');
const router = express.Router();

router.post('/signup',userlogcontroller.createuserlog);
router.post('/login',userlogcontroller.loginUser);
router.get('/:id',userlogcontroller.finduserlogbyid);

module.exports = router;