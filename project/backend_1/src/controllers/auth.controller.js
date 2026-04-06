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
        const createdUser=await userModel.findById(user._id).select("-password -refreshToken")
        return res.status(201).json(new ApiResponse(201, { user: createdUser }, "User registered successfully."))
    }
    catch(error)
    {
        throw new ApiError(500, error?.message || "Something went wrong")
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
        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:true
        })
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:true
        })
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
        const options = { httpOnly: true, secure: true }
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

module.exports={registerUser,loginUser,logoutUser,getProfile}
