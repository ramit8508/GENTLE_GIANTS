const projectModel=require("../models/project.model")
const userModel=require("../models/user.model")
const ApiError=require("../utils/api-error")
const ApiResponse=require("../utils/api-response")

const createProject=async(req,res)=>{
    try {
        const {title,description,tech_stack,roles_needed}=req.body
        if(!title || !description || !tech_stack || !roles_needed)
        {
            throw new ApiError(400,"All fields are required")
        }
        const project=await projectModel.create({
            title,
            description,
            tech_stack,
            roles_needed,
            createdBy:req.user._id
        })
        const createProject=await projectModel.findById(project._id).select("-createdAt -updatedAt")
        return res.status(201).json(new ApiResponse(201,"Project created successfully",createProject))
    }
    catch (error) {
        throw new ApiError(500,"Something went wrong while creating a project",error.message)
    }
}

module.exports={createProject}