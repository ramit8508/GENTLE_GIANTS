const userModel=require("../models/user.model")
const ApiError = require("../utils/api-error")
const ApiResponse = require("../utils/api-response")

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
        if(!name || !email || !password)
        {
            throw new ApiError(400,"Name, email and password are required")
        }

        const existingByEmail = await userModel.findOne({ email })
        if (existingByEmail) {
            throw new ApiError(409, "Email already registered")
        }
        const user=await userModel.create({
            name,
            email,
            password,
            skills: Array.isArray(skills) && skills.length > 0 ? skills : ["General"],
            bio: bio || "",
            github: github || ""
        })
        const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)
        const createdUser=await userModel.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")
        const cookieOptions={
            httpOnly:true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        }
        res.cookie("accessToken",accessToken,cookieOptions)
        res.cookie("refreshToken",refreshToken,cookieOptions)
        return res.status(201).json(new ApiResponse(201, { user: createdUser, accessToken }, "User registered successfully"))
    }
    catch(error)
    {
        throw new ApiError(error?.statusCode || 500, error?.message || "Something went wrong")
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
        return res.status(200).json(new ApiResponse(200, { user: loggedInUser, accessToken}, "User logged in successfully"))
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

const getUsers=async(req,res)=>{
    try {
        const users=await userModel
            .find({ _id: { $ne: req.user._id } })
            .select("-password -refreshToken -createdAt -updatedAt")
        return res.status(200).json(new ApiResponse(200, { users }, "Users fetched successfully"))
    }
    catch(error)
    {
        throw new ApiError(error?.statusCode || 500, error?.message || "Something went wrong")
    }
}

const getUserById=async(req,res)=>{
    try {
        const { id } = req.params
        const user = await userModel.findById(id).select("-password -refreshToken -createdAt -updatedAt")
        if(!user){
            throw new ApiError(404, "User not found")
        }
        return res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"))
    }
    catch(error)
    {
        throw new ApiError(error?.statusCode || 500, error?.message || "Something went wrong")
    }
}

module.exports={registerUser,loginUser,logoutUser,getProfile,getUsers,getUserById}
