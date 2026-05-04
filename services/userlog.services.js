const Userlog = require("../models/userlog.model");
const jwt =require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const {ApiError}=require("../Utills/ApiError");



const createUserLog=(data)=>Userlog.create(data);

const loginUser=async (data)=>{
const userDoc=await Userlog.findOne({email:data.email});
if(!userDoc){
    throw new ApiError("no user found with this email",400);
}
const hashedSaltedPassword=userDoc.password;
const password=data.password;
const isTheOne=await bcrypt.compare(password,hashedSaltedPassword);
if(!isTheOne){
    throw new ApiError("email or password is wrong",400);
}
return jwt.sign({id:userDoc._id,role: userDoc.role},"this-is-my-very-long-secret-key")
}

const getUserById=(id)=>Userlog.findById(id);


module.exports ={
    createUserLog,
    loginUser,
    getUserById
}