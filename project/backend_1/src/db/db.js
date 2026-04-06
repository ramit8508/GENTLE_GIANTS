const mongoose=require("mongoose")
const connectDB=async()=>
{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB is connected successfully")
    }
    catch(error)
    {
        console.log("Error in Connecting database",error)
        process.exit(1)
    }
}

module.exports=connectDB