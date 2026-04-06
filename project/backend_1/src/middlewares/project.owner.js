const projectModel=require("../models/project.model")
const ApiError=require("../utils/api-error")
const ApiResponse=require("../utils/api-response")
const projectOwner=async(req,res,next)=>{
    try{
        const {id}=req.params
        const project=await projectModel.findById(id)
        if(!project){
            throw new ApiError(404,"Project not found")
        }
        if(project.createdBy.toString()!==req.user.id){
            throw new ApiError(403,"You are not the owner of this project")
        }
        next()
    }
    catch(error){
        next(new ApiError(error.statusCode || 500, error.message || "Something went wrong"))
    }
}

module.exports={projectOwner}