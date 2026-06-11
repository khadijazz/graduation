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

proofs: [
    {
        url: { type: String, required: true },
        mediaType: { type: String, enum: ["image", "video"], required: true },
        uploadedAt: { type: Date, default: Date.now }
    }
],

completedAt: {
    type: Date
},

taskType:{
    type:String,
    trim:true,
    default:"daily",
},

},{strict:true})

module.exports=mongoose.model("tasks",tasksSchema);
