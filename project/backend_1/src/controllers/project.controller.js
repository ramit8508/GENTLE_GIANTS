const projectModel=require("../models/project.model")
const userModel=require("../models/user.model")
const notificationModel=require("../models/notification.model")
const mongoose=require("mongoose")
const ApiError=require("../utils/api-error")
const ApiResponse=require("../utils/api-response")

const createNotificationSafe = async ({ recipient, actor, project, type, title, message, metadata = {} }) => {
    if (!recipient || !actor || String(recipient) === String(actor)) {
        return
    }

    try {
        await notificationModel.create({
            recipient,
            actor,
            project: project || null,
            type,
            title,
            message,
            metadata
        })
    } catch (error) {
        console.error("Notification creation failed", error.message)
    }
}

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
        const createdProject=await projectModel
            .findById(project._id)
            .select("-createdAt -updatedAt")
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
        return res.status(201).json(new ApiResponse(201, createdProject, "Project created successfully"))
    }
    catch (error) {
        throw new ApiError(500,"Something went wrong while creating a project",error.message)
    }
}
const getAllProjects=async(req,res)=>{
    try {
        const projects=await projectModel
            .find()
            .select("-createdAt -updatedAt")
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
        if(!projects)
        {
            throw new ApiError(404,"No projects found")
        }
        return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"))
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
                .populate("createdBy", "name email")
                .populate("members.user", "name email");
            return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
        }
        const projects = await projectModel.find(query)
            .populate("createdBy", "name email")
            .populate("members.user", "name email");
        return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"))
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
        await createNotificationSafe({
            recipient: project.createdBy,
            actor: req.user._id,
            project: project._id,
            type: "join_request",
            title: "New join request",
            message: `${req.user.name} requested to join \"${project.title}\"`,
            metadata: {
                requesterId: req.user._id,
                projectId: project._id
            }
        })
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
                const shouldNotifyRequester = request.user && String(request.user) !== String(req.user._id)
                if (shouldNotifyRequester) {
                    await createNotificationSafe({
                        recipient: request.user,
                        actor: req.user._id,
                        project: project._id,
                        type: action === "accept" ? "join_request_accepted" : "join_request_rejected",
                        title: action === "accept" ? "Join request accepted" : "Join request rejected",
                        message:
                            action === "accept"
                                ? `Your request to join \"${project.title}\" was accepted`
                                : `Your request to join \"${project.title}\" was rejected`,
                        metadata: {
                            projectId: project._id,
                            action
                        }
                    })
                }
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
        .populate("createdBy","name email")
        .populate("members.user","name email")
        .populate("join_requests.user","name email")
        const joinedProjects = await projectModel
        .find({ "members.user":userId })
        .select("title tech_stack roles_needed createdBy")
        .populate("createdBy","name email")
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
        .populate("createdBy","name email")
        const removedFromProjects = await projectModel
        .find({ "removed_members.user":userId })
        .select("title tech_stack roles_needed created_by")
        .populate("createdBy","name email")
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
        .populate("createdBy","name email")
        return res.status(200).json(new ApiResponse(200, {
            createdProjects,
            joinedProjects,
            pendingRequests,
            removedFromProjects,
            pendingInvitations
        }, "Your projects fetched successfully"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while fetching your projects")
    }
}
const getProjectById=async(req,res)=>{
    try {
        const project = await projectModel.findById(req.params.id)
            .populate("createdBy","name email")
            .populate("members.user","name email")
            .populate("join_requests.user","name email")
        if(!project){
            throw new ApiError(404,"Project not found")
        }
        return res.status(200).json(new ApiResponse(200, project, "Project fetched successfully"))
    } catch(error){
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while fetching the project")
    }
}
const removeMember=async(req,res)=>{
  try{
    const { id } = req.params
    const { userId } = req.body
    const project = await projectModel.findById(id)
    if(!project){
      throw new ApiError(404,"Project not found")
    }
    project.members = project.members.filter(m => m.user.toString() !== userId)
    if (!project.removed_members.some(m => m.user.toString() === userId)) {
      project.removed_members.push({ user: userId })
    }
    await project.save()
        await createNotificationSafe({
            recipient: userId,
            actor: req.user._id,
            project: project._id,
            type: "removed_from_project",
            title: "Removed from project",
            message: `You have been removed from \"${project.title}\"`,
            metadata: {
                projectId: project._id
            }
        })
    if(!project){
      throw new ApiError(404,"Project not found")
    }
    return res.status(200).json(new ApiResponse(200,"Member removed successfully",project))
  }catch(error){
    throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while removing the member")
  }
}
const inviteMember=async(req, res)=> {
    try {
        const { id } = req.params; // project id
        const { userId } = req.body;
        if(!mongoose.Types.ObjectId.isValid(String(id))){
            throw new ApiError(400, "Invalid project id")
        }
        if(!userId){
            throw new ApiError(400, "User id is required")
        }
        if(!mongoose.Types.ObjectId.isValid(String(userId))){
            throw new ApiError(400, "Invalid user id")
        }
        const project = await projectModel.findById(id);
        if (!project) {
            throw new ApiError(404, "Project not found")
        }
        const ownerId = project.createdBy || project.created_by
        if(!ownerId){
            throw new ApiError(400, "Project owner is missing")
        }
        if(String(ownerId) !== String(req.user._id || req.user.id)){
            throw new ApiError(403, "Only project owner can invite members")
        }
        if(String(req.user._id) === String(userId)){
            throw new ApiError(400, "You cannot invite yourself")
        }
        const invitedUser = await userModel.findById(userId)
        if(!invitedUser){
            throw new ApiError(404, "User not found")
        }
        const isMember = project.members.some(m => String(m.user) === String(userId));
        if (isMember) {
            throw new ApiError(400, "User is already a member")
        }
        const alreadyInvited = project.invitations.some(i => String(i.user) === String(userId) && i.status === "pending");
        if (alreadyInvited) {
            throw new ApiError(400, "User is already invited")
        }
        project.invitations.push({ user: userId });
        await project.save();
        await createNotificationSafe({
            recipient: userId,
            actor: req.user._id,
            project: project._id,
            type: "invite_received",
            title: "Project invitation",
            message: `You were invited to join \"${project.title}\"`,
            metadata: {
                projectId: project._id
            }
        })
        return res.status(200).json(new ApiResponse(200,"Invitation sent successfully",project));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while inviting the member")
    }
}
const respondToInvitation=async(req,res)=>{
    try {
        const { id } = req.params;
        const { action, role } = req.body;
        const userId = req.user._id.toString();
        const project = await projectModel.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        const invitation = project.invitations.find(i => i.user.toString() === userId && i.status === "pending");
        if (!invitation) return res.status(404).json({ message: "Pending invitation not found" });
        if (action === "accept") {
            invitation.status = "accepted";
            const validRoles=["frontend","backend","fullstack","ui/ux","project_manager","other"]
            const memberRole = validRoles.includes(role) ? role : "other"
            project.members.push({ user: userId, role: memberRole });
        } else if (action === "reject") {
            invitation.status = "rejected";
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
        await project.save();
        await createNotificationSafe({
            recipient: project.createdBy,
            actor: req.user._id,
            project: project._id,
            type: action === "accept" ? "invite_accepted" : "invite_rejected",
            title: action === "accept" ? "Invitation accepted" : "Invitation rejected",
            message:
                action === "accept"
                    ? `${req.user.name} accepted your invitation for \"${project.title}\"`
                    : `${req.user.name} rejected your invitation for \"${project.title}\"`,
            metadata: {
                projectId: project._id,
                action
            }
        })
        return res.status(200).json(new ApiResponse(200,"Invitation responded successfully",project));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while responding to the invitation")
    }
}


module.exports={createProject,getAllProjects,searchProject,updateProject,deleteProject,requestToJoinProject,respondJoin,getMyProjects,getProjectById,removeMember,inviteMember,respondToInvitation}