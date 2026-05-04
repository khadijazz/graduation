const {ApiError}=require("./ApiError");

exports.permittedTo=(roles)=>{
    return(req,res,next)=>{

if(roles.includes(req.user.role)){
return next();
}
next(new ApiError("You are not permitted to do this action",403));
    };
};

