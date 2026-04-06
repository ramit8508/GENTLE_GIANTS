const express=require("express")
const app=express()
const cookieParser=require("cookie-parser")
const cors=require("cors")
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
const authRoutes=require("./routes/user.route")
app.use("/api/auth",authRoutes)
const projectRoutes=require("./routes/project.route")
app.use("/api/project",projectRoutes)
const aiRoutes=require("./routes/ai.route")
app.use("/api/ai",aiRoutes)
const notificationRoutes=require("./routes/notification.route")
app.use("/api/notifications",notificationRoutes)
app.use((err,req,res,next)=>{
    const statusCode=err.statusCode || 500
    const message=err.message || "Internal Server Error"
    return res.status(statusCode).json({statusCode,message,errors:err.errors||[]})
})
module.exports=app
