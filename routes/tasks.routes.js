const express=require("express");
const taskController=require("../controllers/task.controller");
const router=express.Router();
const verifyUser=require("../Utills/verifyUser")
const { permittedTo} =require("../Utills/premittedTo");
const { upload } = require("../Utills/uploadCloudinary");
router.use(verifyUser);


router.route("/")
.get(permittedTo(["caregiver","client"]),taskController.getAllTasks)
.delete(permittedTo(["caregiver","client"]),taskController.deleteAllTasks);

router.route("/:id/proof")
.post(permittedTo(["caregiver"]), upload.single("proof"), taskController.uploadTaskProof);

router.route("/:id/complete")
.patch(permittedTo(["caregiver"]), taskController.completeTask);

router.route("/:id")
.post(permittedTo(["client"]),taskController.createTasks)
.get(permittedTo(["caregiver","client"]),taskController.getTaskById)
.patch(permittedTo(["caregiver","client"]),taskController.updateTask)
.delete(permittedTo(["caregiver","client"]),taskController.deleteTask);


module.exports=router;