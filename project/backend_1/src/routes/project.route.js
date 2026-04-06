const express=require("express")
const projectControllers=require("../controllers/project.controller")
const {authmiddleware}=require("../middlewares/auth.middleware")
const router=express.Router()
router.route("/create").post(authmiddleware,projectControllers.createProject)
router.route("/").get(projectControllers.getAllProjects)
router.route("/search").get(projectControllers.searchProject)
module.exports=router