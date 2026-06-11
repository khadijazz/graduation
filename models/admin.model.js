const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminAddressSchema = new mongoose.Schema({
    city: String,
    street: String,
    building: String
});

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "admin"
    },

    level: {
        type: String,
        enum: ["Super Admin", "Admin"],
        default: "Admin"
    },

    address: adminAddressSchema,
}, { timestamps: true })
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.passwordConfirmation = undefined;
  this.password = await bcrypt.hash(this.password, 10);
});
adminSchema.post("find*",function(result){
result.password=undefined;
})


module.exports = mongoose.model("admin", adminSchema);