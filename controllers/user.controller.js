const  {UserModel}= require('../models/user.model');

const postuser= async (req, res) => {
   const userData = req.body;
   const user = await UserModel.create(userData);
   res.status(201).json({status: 'success',
    message: 'User created successfully',
    data: user});
    
};

module.exports = { postuser };