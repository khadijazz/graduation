const express = require("express");
const taskController = require("../controllers/task.controller");
const router = express.Router();
const verifyUser = require("../Utills/verifyUser");
const { permittedTo } = require("../Utills/premittedTo");
const { upload } = require("../Utills/uploadCloudinary");

router.use(verifyUser);

router.route("/")
    .get(permittedTo(["caregiver", "client"]), taskController.getAllTasks)
    .delete(permittedTo(["caregiver", "client"]), taskController.deleteAllTasks);

router.route("/:id/check-in")
    .post(permittedTo(["caregiver"]), taskController.checkIn);



router.route("/:bookingId/check-out")
    .post(permittedTo(["caregiver"]), taskController.checkOut);

router.route("/upload-proof/:id")
  .post(
    permittedTo(["caregiver"]),
    upload.single("file"),
    taskController.uploadProof
  );

router.route("/:id")
    .post(permittedTo(["client"]), taskController.createTasks)
    .get(permittedTo(["caregiver", "client"]), taskController.getTaskById)
    .patch(permittedTo(["caregiver", "client"]), taskController.updateTask)
    .delete(permittedTo(["caregiver", "client"]), taskController.deleteTask);

module.exports = router;