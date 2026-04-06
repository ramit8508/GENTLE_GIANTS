const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")
const ApiError = require("../utils/api-error")

const authmiddleware = async (req, res, next) => {
    try {
        const headerToken = req.headers?.authorization?.replace("Bearer ", "")
        const token = headerToken || req.cookies?.accessToken
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await userModel.findById(decoded._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }
        req.user = user
        next()
    }
    catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"))
    }
}


module.exports = { authmiddleware }
