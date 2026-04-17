const express=require("express");
const taskController=require("../controllers/task.controller");
const router=express.Router();


router.route("/")
.post(taskController.createTask)
.get(taskController.getAllTasks)
.delete(taskController.deleteAllTasks);

router.route("/:id")
.get(taskController.getTaskById)
.patch(taskController.updateTask)
.delete(taskController.deleteTask);


module.exports=router;