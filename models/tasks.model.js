const mongoose=require("mongoose");

const tasksSchema=mongoose.Schema({
taskID:{
    type:String,
    required:true,
    unique:true,
},
taskTitle:{
    type:String,
    required:true,
},
taskDescription:{
    type:String,
    required:true,
    trim:true,
},
taskState:{
    type:String,
    required:true,
    trim:true,
    enum:["pending","in-progress","completed"],
    default:"pending",
},
proofType:{
    type:String,
    required:true,
    trim:true,
    enum:["image","video",""],
    default:"image",
},
proofUrl:{
    type:String,
    required:true,
    trim:true,
},

taskType:{
    type:String,
    trim:true,
    default:"daily",
},

},{strict:true})

module.exports=mongoose.model("tasks",tasksSchema);
