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
        const createdProject=await projectModel.findById(project._id).select("-createdAt -updatedAt")
        return res.status(201).json(new ApiResponse(201,"Project created successfully",createdProject))
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
const updateProject=async(req,res)=>{
   try{
    const allowedFields=["title","description","tech_stack","roles_needed"];
            const updates = {};
             allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
            const updatedProject=await projectModel.findByIdAndUpdate(req.params.id,updates,{new:true})
            return res.status(200).json({message:"Project updated successfully" ,
                 updatedProject
            })  
        } catch (error) {
            return res.status(500).json({message:error.message})
        }
    }   
const deleteProject=async(req,res)=>{
        try {
            const deletedProject=await projectModel.findByIdAndDelete(req.params.id)
            return res.status(200).json({message:"Project deleted successfully" ,deletedProject})
        } catch (error) {
            return res.status(500).json({message:error.message})
        }
    }   
const requestToJoinProject=async(req,res)=>{
    try{
        const id=req.params.id
        const project = await projectModel.findById(id)
        if(!project){
        throw new ApiError(404,"Project not found")}
        const user= await userModel.findById(req.user.id)
        const skillMatch = project.tech_stack.some(skill =>
            user.skills.includes(skill))
        if(!skillMatch){
           throw new ApiError(400,"You are lacking the skills required for this project")
        }
        const requested=project.join_requests.some(
            r=> r.user && r.user.toString()===req.user._id.toString()
        )
          if(requested){
            throw new ApiError(400,"You already requested to join this project")
        }
        if(project.createdBy.toString()===req.user._id.toString()){
            throw new ApiError(400,"You are the creator of this project")
        }
        const alreadyMember=project.members.some(
            m=> m.user && m.user.toString()===req.user._id.toString()
        )
        if(alreadyMember){
            throw new ApiError(400,"You are already a member of this project")
        }
        project.join_requests.push({ user: req.user._id })
        await project.save()
        return res.status(200).json(new ApiResponse(200,"Request sent to project creator",project))
    }
    catch(error){
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while requesting to join the project")}
    }
const respondJoin=async(req,res)=>{
            try {
                const {userid, action, role}=req.body
                const project=await projectModel.findById(req.params.id)
                const request=project.join_requests.find(
                    r=> r.user && r.user.toString()===userid
                )
                if(!request){
                    throw new ApiError(404,"Request not found")
                }
                if(action==="accept"){
                    request.status="accepted"
                    const validRoles=["frontend","backend","fullstack","ui/ux","project_manager","other"]
                    const memberRole=validRoles.includes(role) ? role : "other"
                    project.members.push({user:userid, role:memberRole})
                }
                else if(action==="reject"){
                    request.status="rejected"
                }
                else{
                    throw new ApiError(400,"Invalid action. Use 'accept' or 'reject'")
                }
                await project.save()
                return res.status(200).json(new ApiResponse(200,"Request responded successfully",project))
            } catch (error) {
                throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while responding to the request")
            }
    }
const getMyProjects=async(req,res)=>{
    try {
        const userId = req.user.id
        const createdProjects = await projectModel
        .find({ createdBy:userId })
        .select("title tech_stack roles_needed createdBy members join_requests")
        .populate("createdBy","name")
        .populate("members.user","name")
        .populate("join_requests.user","name")
        const joinedProjects = await projectModel
        .find({ "members.user":userId })
        .select("title tech_stack roles_needed createdBy")
        .populate("createdBy","name")
        const pendingRequests = await projectModel
        .find({
            created_by:{ $ne:userId },
            join_requests:{
                $elemMatch:{
                    user:userId,
                    status:"pending"
                }
            }
        })
        .select("title tech_stack roles_needed created_by")
        .populate("createdBy","name")
        const removedFromProjects = await projectModel
        .find({ "removed_members.user":userId })
        .select("title tech_stack roles_needed created_by")
        .populate("createdBy","name")
        const pendingInvitations = await projectModel
        .find({
            invitations:{
                $elemMatch:{
                    user:userId,
                    status:"pending"
                }
            }
        })
        .select("title tech_stack roles_needed created_by")
        .populate("createdBy","name")
        return res.status(200).json(new ApiResponse(200,"Your projects fetched successfully",{
            createdProjects,
            joinedProjects,
            pendingRequests,
            removedFromProjects,
            pendingInvitations
        }))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while fetching your projects")
    }
}


module.exports={createProject,getAllProjects,searchProject,updateProject,deleteProject,requestToJoinProject,respondJoin,getMyProjects}