const express=require("express")
const {registerUser,loginUser,logoutUser}=require("../controllers/auth.controller")
const {verifyJWT}=require("../middlewares/auth.middleware")
const router=express.Router()
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
module.exports=router