const jwt = require("jsonwebtoken");
const {getUserById}=require("../services/userlog.services")
const{ApiError}=require("../Utills/ApiError");
module.exports = async(req, res, next) => {
    const bearerToken = req.headers["authorization"];
 if(!bearerToken){
    throw new ApiError("you are not logged in",401);
   }
const token=bearerToken.split("Bearer ")[1];
   const payload = jwt.verify(token,"this-is-my-very-long-secret-key");
   const user =await getUserById(payload.id)
  
   req.user=user;
   next();

}