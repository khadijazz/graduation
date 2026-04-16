const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    building: { type: String, trim: true },
    street: { type: String, trim: true },
    area: { type: String, trim: true },
  },
  { _id: false }
);


const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    }, 

    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["CLIENT", "CAREGIVER", "ADMIN"],
      required: true,
    },
    address: {
      type: addressSchema,
      default: true,
    },

    dob: {
      type: Date,
    },

} , { timestamps: true ,
       strict: true
      
});

 const UserModel = mongoose.model('User', userSchema);
 module.exports = { UserModel }; 

/*(async () => {
    
 await UserModel.create({ name: 'John Doe',
     email: 'john.doe@example.com', 
     password: 'password123',
     dob: new Date('1990-01-01'),
     phone: '1234567890', 
     role: 'CLIENT' ,
     address: {
      building: '123',
      street: 'Main St',
      area: 'Downtown'},
    
  });
})(); */

 