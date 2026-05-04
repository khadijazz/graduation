const tasks=require("../models/tasks.model");
const { ApiFeature } = require("../Utills/ApiFeature");
const createTasks = (data) => tasks.create(data);
const getalltasks = (queryParams) =>{
    const apiFeature=new ApiFeature(tasks.find({}),queryParams);
    apiFeature.paginate();
    apiFeature.sort();
    apiFeature.projection();
    return apiFeature.dbQuery;
};
const gettasksbyid = (id) => tasks.findById(id);
const updatetasks = (id, updates) => tasks.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
const deletetasks = (id) => tasks.findByIdAndDelete(id);
const deleteAllTasks = () => tasks.deleteMany();
module.exports={createTasks,getalltasks,gettasksbyid,updatetasks,deletetasks,deleteAllTasks}