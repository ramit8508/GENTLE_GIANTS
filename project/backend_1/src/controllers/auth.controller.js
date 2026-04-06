const userModel=require("../models/user.model")
const ApiError = require("../utils/api-error")
const ApiResponse = require("../utils/api-response")
const crypto = require("crypto")
const {sendEmail, emailVerificationMailgenContent, forgotPasswordMailgenContent} = require("../utils/mail")

const generateAccessandRefreshToken = async (userId) =>
{
    try {
        const user=await userModel.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    }
    catch(error)
    {
        throw new ApiError(500, error?.message || "Something went wrong")
    }
}

const registerUser=async(req,res)=>{
    try {
        const {name,email,password,skills,bio,github}=req.body
        if(!name || !email || !password || !skills || !bio || !github)
        {
            throw new ApiError(400,"All fields are required")
        }
        const isAlreadyUser=await userModel.findOne(
            {
               $or:[{email},{name}]
            }
        )
        if(isAlreadyUser)
        {
            throw new ApiError(400,"User already exists")
        }
        const user=await userModel.create({
            name,
            email,
            password,
            skills,
            bio,
            github
        })
        const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()
        user.emailVerificationToken = hashedToken
        user.emailVerificationExpiry = tokenExpiry
        await user.save({validateBeforeSave:false})
        const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${unhashedToken}`
        await sendEmail({
            email: user.email,
            subject: "Verify your email - CollabHub",
            mailgenContent: emailVerificationMailgenContent(user.name, verificationUrl)
        })

        const createdUser=await userModel.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")
        return res.status(201).json(new ApiResponse(201, { user: createdUser }, "User registered successfully. Please check your email to verify your account."))
    }
    catch(error)
    {
        throw new ApiError(error?.statusCode || 500, error?.message || "Something went wrong")
    }
}

const verifyEmail=async(req,res)=>{
    try {
        const {token} = req.params
        if(!token){
            throw new ApiError(400,"Token is required")
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
        const user = await userModel.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() }
        })
        if(!user){
            throw new ApiError(400,"Token is invalid or has expired")
        }
        user.isEmailVerified = true
        user.emailVerificationToken = undefined
        user.emailVerificationExpiry = undefined
        await user.save({validateBeforeSave:false})
        return res.status(200).send(`
            <html><body style="font-family:sans-serif;text-align:center;margin-top:80px">
            <h2 style="color:green">✅ Email Verified Successfully!</h2>
            <p>Your email has been verified. You can now log in to CollabHub.</p>
            </body></html>
        `)
    }
    catch(error)
    {
        return res.status(500).send(`
            <html><body style="font-family:sans-serif;text-align:center;margin-top:80px">
            <h2 style="color:red">❌ Something went wrong</h2>
            <p>${error.message}</p>
            </body></html>
        `)
    }
}

const loginUser=async(req,res)=>{
    try {
        const {email,password}=req.body
        if(!email || !password)
        {
            throw new ApiError(400,"All fields are required")
        }
        const user=await userModel.findOne({email})
        if(!user)
        {
            throw new ApiError(400,"User not found")
        }
        // Block login if email is not verified
        if(!user.isEmailVerified)
        {
            throw new ApiError(403,"Your email is not verified. Please check your inbox and verify your email before logging in.")
        }
        const isPasswordCorrect=await user.isPasswordCorrect(password)
        if(!isPasswordCorrect)
        {
            throw new ApiError(400,"Invalid password")
        }
        const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)
        const loggedInUser=await userModel.findById(user._id).select("-password -refreshToken")
        const cookieOptions={
            httpOnly:true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        }
        res.cookie("accessToken",accessToken,cookieOptions)
        res.cookie("refreshToken",refreshToken,cookieOptions)
        return res.status(200).json(new ApiResponse(200, { user: loggedInUser}, "User logged in successfully"))
    }
    catch(error)
    {
        throw new ApiError(error.statusCode || 500, error?.message || "Something went wrong")
    }
}

const logoutUser=async(req,res)=>{
    try {
        await userModel.findByIdAndUpdate(req.user._id, { $set: { refreshToken: "" } })
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        }
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"))
    }
    catch(error)
    {
        throw new ApiError(500,"Something went wrong")
    }
}

const forgotPassword=async(req,res)=>{
    try {
        const {email} = req.body
        if(!email){
            throw new ApiError(400,"Email is required")
        }
        const user = await userModel.findOne({email})
        if(!user){
            throw new ApiError(404,"User not found")
        }
        const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()
        user.forgotPasswordToken = hashedToken
        user.forgotPasswordExpiry = tokenExpiry
        await user.save({validateBeforeSave:false})
        const resetUrl = `${process.env.BASE_URL}/api/auth/reset-password/${unhashedToken}`
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request - CollabHub",
            mailgenContent: forgotPasswordMailgenContent(user.name, resetUrl)
        })
        return res.status(200).json(new ApiResponse(200, {}, "Password reset email sent. Please check your inbox."))
    }
    catch(error)
    {
        throw new ApiError(error.statusCode || 500, error?.message || "Something went wrong")
    }
}

const resetPassword=async(req,res)=>{
    try {
        const {token} = req.params
        const {password} = req.body
        if(!token || !password){
            throw new ApiError(400,"Token and new password are required")
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
        const user = await userModel.findOne({
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: { $gt: Date.now() }
        })
        if(!user){
            throw new ApiError(400,"Token is invalid or has expired")
        }
        user.password = password
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry = undefined
        await user.save()
        return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully. You can now login with your new password."))
    }
    catch(error)
    {
        throw new ApiError(error.statusCode || 500, error?.message || "Something went wrong")
    }
}

const resendVerificationEmail=async(req,res)=>{
    try {
        const user = await userModel.findById(req.user._id)
        if(user.isEmailVerified){
            throw new ApiError(400,"Email is already verified")
        }
        const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()
        user.emailVerificationToken = hashedToken
        user.emailVerificationExpiry = tokenExpiry
        await user.save({validateBeforeSave:false})

        const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${unhashedToken}`
        await sendEmail({
            email: user.email,
            subject: "Verify your email - CollabHub",
            mailgenContent: emailVerificationMailgenContent(user.name, verificationUrl)
        })
        return res.status(200).json(new ApiResponse(200, {}, "Verification email resent. Please check your inbox."))
    }
    catch(error)
    {
        throw new ApiError(error.statusCode || 500, error?.message || "Something went wrong")
    }
}

const getProfile=async(req,res)=>{
    try {
        const user=await userModel.findById(req.user._id).select("-password -refreshToken -createdAt -updatedAt")
        return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"))
    }
    catch(error)
    {
        throw new ApiError(500,"Something went wrong")
    }
}

module.exports={registerUser,loginUser,logoutUser,getProfile,verifyEmail,forgotPassword,resetPassword,resendVerificationEmail}
