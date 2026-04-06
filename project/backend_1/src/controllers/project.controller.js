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
const getAllProjects=async(req,res)=>{
    try {
        const projects=await projectModel.find().select("-createdAt -updatedAt")
        if(!projects)
        {
            throw new ApiError(404,"No projects found")
        }
        return res.status(200).json(new ApiResponse(200,"Projects fetched successfully",projects))
    }
    catch (error) {
        throw new ApiError(500,"Something went wrong while fetching projects",error.message)
    }
}
const searchProject=async(req,res)=>{
    try {
        const {q}=req.query
        let query ={}
        if(q)
        {
            const regex=new RegExp(q,"i")
                   query.$or = [
                    { title: { $regex: regex } },
                    { tech_stack: { $regex: regex } },
                    { roles_needed: { $regex: regex } }
                ];
        }
         const techStack = req.query.tech_stack || req.query['tech_stack[]'];
        if (techStack) 
        {
                const techArray = Array.isArray(techStack) ? techStack : [techStack];
                query.tech_stack = { $in: techArray };
        }
        const roles = req.query.roles || req.query['roles[]'];
        if (roles) 
        {
            const rolesArray = Array.isArray(roles) ? roles : [roles];
            query.roles_needed = { $in: rolesArray };
        }
        if (Object.keys(query).length === 0) 
        {
            const projects = await projectModel.find()
                .populate("createdBy", "name")
                .populate("members.user", "name");
            return res.status(200).json(new ApiResponse(200,"Projects fetched successfully",projects));
        }
        const projects = await projectModel.find(query)
            .populate("createdBy", "name")
            .populate("members.user", "name");
        return res.status(200).json(new ApiResponse(200,"Projects fetched successfully",projects))
    } catch (error) {
        throw new ApiError(500,"Something went wrong while fetching projects",error.message)
    }
}
module.exports={createProject,getAllProjects,searchProject}