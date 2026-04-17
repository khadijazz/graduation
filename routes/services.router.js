const express=require("express");
const servicesController=require("../controllers/services.controller");
const router=express.Router();

router.route("/")
.post(servicesController.createService)
.get(servicesController.getAllServices)
.delete(servicesController.deletAllServices);

router.route("/:id")
.get(servicesController.getService)
.patch(servicesController.updateService)
.delete(servicesController.deleteService);

module.exports=router;