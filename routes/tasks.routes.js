const express=require("express");
const taskController=require("../controllers/task.controller");
const router=express.Router();
const verifyUser=require("../Utills/verifyuser")
const {permittedTo} =require("../Utills/premittedTo");
router.use(verifyUser);


router.route("/")
.post(permittedTo(["admin"]),taskController.createTask)
.get(taskController.getAllTasks)
.delete(taskController.deleteAllTasks);

router.route("/:id")
.get(taskController.getTaskById)
.patch(taskController.updateTask)
.delete(taskController.deleteTask);


module.exports=router;