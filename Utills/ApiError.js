exports.ApiError=
class ApiError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode=statusCode;
        this.name=ApiError.name;
        this.isOperational=true;
        Error.captureStackTrace(this,this.constructor);
    }
};