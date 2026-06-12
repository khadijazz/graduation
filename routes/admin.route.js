const express = require('express');
const admincontroller = require('../controllers/admin.conroller');
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");
const router = express.Router();

router.post('/createadmin', admincontroller.createadmin);

// Admin protected routes
router.use(verifyUser, permittedTo(["admin"]));

// Caregiver approval
router.get('/caregivers/pending', admincontroller.getPendingCaregivers);
router.get('/caregivers/:id', admincontroller.getCaregiverDetails);
router.patch('/caregivers/:id/approve', admincontroller.approveCaregiver);
router.patch('/caregivers/:id/reject', admincontroller.rejectCaregiver);

// Complaints management
router.get('/complaints', admincontroller.getComplaints);
router.get('/complaints/:id', admincontroller.getComplaintById);
router.patch('/complaints/:id', admincontroller.updateComplaintStatus);

// Account moderation (blocking/unblocking)
router.patch('/block/:id', admincontroller.blockUser);
router.patch('/unblock/:id', admincontroller.unblockUser);

module.exports = router;