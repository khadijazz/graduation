const taskServices=require("../services/task.services");

exports.createTask=async (req,res,next)=>{
const Data=req.body;
const Task=await taskServices.createTask(Data);
res.status(201).json({
    message:"task created successfully",
    status:"success",
    data:Task
})
}

exports.getAllTasks=async (req,res,next)=>{
const Task=await taskServices.getalltasks(req.query);
res.status(200).json({
    message:"tasks retrieved successfully",
    status:"success",
    data:Task
})
}

exports.getTaskById=async (req,res,next)=>{
const Task=await taskServices.gettasksbyid(req.params.id);
if(!Task){
    throw new ApiError("task not found",404);
}
res.status(200).json({
    message:"task retrieved successfully",
    status:"success",
    data:Task
})
}

exports.updateTask=async (req,res,next)=>{
const Task=await taskServices.updatetasks(req.params.id,req.body);
res.status(200).json({
    message:"task updated successfully",
    status:"success",
    data:Task
})
}

exports.deleteTask=async (req,res,next)=>{
const Task=await taskServices.deletetasks(req.params.id);
res.status(200).json({
    message:"task deleted successfully",
    status:"success",
    data:Task
})
}
exports.deleteAllTasks=async (req,res,next)=>{
const Task=await taskServices.deleteAllTasks();
res.status(200).json({
    message:"tasks deleted successfully",
    status:"success",
    data:Task
})
}