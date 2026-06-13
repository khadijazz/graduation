const mongoose = require("mongoose");

const proofFileSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    fileType: {
        type: String,
        enum: ["image", "video"],
        required: true,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    }
});

const tasksSchema = mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
    },

    taskDescription: {
        type: String,
        required: true,
        trim: true,
    },
    taskState: {
        type: String,
        trim: true,
        enum: ["Pending", "In Progress", "Completed", "pending", "in-progress", "completed"],
        default: "Pending",
    },
    proofType: {
        type: String,
        trim: true,
        enum: ["image", "video"],
    
    },
    proofUrl: {
        type: String,
        trim: true,
    },

    taskType: {
        type: String,
        trim: true,
        default: "daily",
    },

    checkInTime: {
        type: Date,
    },
    checkOutTime: {
        type: Date,
    },
    proofFiles: [proofFileSchema],

}, { strict: true })

module.exports = mongoose.model("tasks", tasksSchema);

