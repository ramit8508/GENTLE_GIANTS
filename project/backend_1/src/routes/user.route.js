const express=require("express")
const authControllers=require("../controllers/auth.controller")
const {verifyJWT}=require("../middlewares/auth.middleware")
const router=express.Router()
router.route("/register").post(authControllers.registerUser)
router.route("/login").post(authControllers.loginUser)
router.route("/logout").post(verifyJWT,authControllers.logoutUser)
router.route("/profile").get(verifyJWT,authControllers.getProfile)
module.exports=router