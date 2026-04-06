const express=require("express")
const authControllers=require("../controllers/auth.controller")
const {authmiddleware}=require("../middlewares/auth.middleware")
const router=express.Router()

router.route("/register").post(authControllers.registerUser)
router.route("/login").post(authControllers.loginUser)
router.route("/logout").post(authmiddleware,authControllers.logoutUser)
router.route("/profile").get(authmiddleware,authControllers.getProfile)
router.route("/verify-email/:token").get(authControllers.verifyEmail)
router.route("/resend-verification").post(authmiddleware, authControllers.resendVerificationEmail)
router.route("/forgot-password").post(authControllers.forgotPassword)
router.route("/reset-password/:token").post(authControllers.resetPassword)

module.exports=router