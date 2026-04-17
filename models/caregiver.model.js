const mongoose = require("mongoose");

const caregiverSchema = new mongoose.Schema({
    role: { type: String },
    price: { type: Number },
    availability: { type: String },
    experience: { type: String },
    profile_picture: { type: String },
    certifications: { type: String },
    verifcation_documents: { type: String },
    isverified: Boolean,

}, {
    strict: true
});


const CaregiverModel = mongoose.model("Caregiver", caregiverSchema);
module.exports = CaregiverModel;

/* (async  ()=>{
    await CaregiverModel.create({
        role:"nurse",
        price:100,
        availability:"full-time",
        experience:"5 years",
        profile_picture:"https://example.com/profile.jpg",
        certifications:"https://example.com/certifications.pdf",
        verifcation_documents:"https://example.com/verification.pdf",
        isverified:true,
    })
}) ()*/

//(async()=>{
/*  const caregiver =new CaregiverModel({
        role:"hostability",
        price:2500,
        availability:"full-time",
        experience:"6 years",
        profile_picture:"https://example.com/profile.jpg",
        certifications:"https://example.com/certifications.pdf",
        verifcation_documents:"https://example.com/verification.pdf",
        isverified:true,
    });
   await caregiver.save();
    caregiver.price=3000;
    caregiver.availability="part-time";
await caregiver.save();
    */
//const caregivers= await CaregiverModel.find({price:3000})
//console.log(caregivers);
//})()