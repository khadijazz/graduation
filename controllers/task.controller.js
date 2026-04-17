const task=require("../models/tasks.model");

exports.createTask=async (req,res,next)=>{
const Data=req.body;
const Task=await task.create(Data);
res.status(201).json({
    message:"task created successfully",
    status:"success",
    data:Task
})
}

exports.getAllTasks=async (req,res,next)=>{
const Task=await task.find({});
res.status(200).json({
    message:"tasks retrieved successfully",
    status:"success",
    data:Task
})
}

exports.getTaskById=async (req,res,next)=>{
const Task=await task.findById(req.params.id);
res.status(200).json({
    message:"task retrieved successfully",
    status:"success",
    data:Task
})
}

exports.updateTask=async (req,res,next)=>{
const Task=await task.findByIdAndUpdate(req.params.id,req.body,{new:true});
res.status(200).json({
    message:"task updated successfully",
    status:"success",
    data:Task
})
}

exports.deleteTask=async (req,res,next)=>{
const Task=await task.findByIdAndDelete(req.params.id);
res.status(200).json({
    message:"task deleted successfully",
    status:"success",
    data:Task
})
}
exports.deleteAllTasks=async (req,res,next)=>{
const Task=await task.deleteMany();
res.status(200).json({
    message:"tasks deleted successfully",
    status:"success",
    data:Task
})
}