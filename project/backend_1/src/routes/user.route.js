const express=require("express")
const authControllers=require("../controllers/auth.controller")
const {authmiddleware}=require("../middlewares/auth.middleware")
const router=express.Router()

router.route("/register").post(authControllers.registerUser)
router.route("/login").post(authControllers.loginUser)
router.route("/logout").post(authmiddleware,authControllers.logoutUser)
router.route("/profile").get(authmiddleware,authControllers.getProfile)
router.route("/users").get(authmiddleware,authControllers.getUsers)
router.route("/users/:id").get(authmiddleware,authControllers.getUserById)

module.exports=router