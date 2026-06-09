const mongoose=require("mongoose");

const tasksSchema=mongoose.Schema({
request:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Request",
},


taskDescription:{
    type:String,
    required:true,
    trim:true,
},
taskState:{
    type:String,
    trim:true,
    enum:["pending","in-progress","completed"],
    default:"pending",
},
proofType:{
    type:String,
    trim:true,
    enum:["image","video",""],
    default:"image",
},
proofUrl:{
    type:String,
    trim:true,
},

taskType:{
    type:String,
    trim:true,
    default:"daily",
},

},{strict:true})

module.exports=mongoose.model("tasks",tasksSchema);
