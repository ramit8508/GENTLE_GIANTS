const mongoose=require("mongoose")
const userSchema=new mongoose.Schema({
  name:
  {
    type:String,
    required:true,
    trim:true,
  },
  email:
  {
    type:String,
    required:true,
    trim:true,
    unique:true,
    lowercase:true,
    match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Invalid email format"]
  },
  password:
  {
    type:String,
    required:true,
    trim:true,
    minlength:[8,"Password must be at least 8 characters long"],
    maxlength:[20,"Password must be at most 20 characters long"]
  },
  skills:
  {
    type:[String],
    required:true,
    trim:true,
    default:[],
    validate:{
      validator:function(v){
        return v.length>0
      },
      message:"Skills are required"
    }
  },
  bio:
  {
    type:String,
    trim:true,
    maxlength:[100,"Bio must be at most 100 characters long"]
  },
  github:
  {
    type:String,
    trim:true
  },
  isEmailVerified:
  {
    type:Boolean,
    required:false
  },
  refreshToken:
  {
    type:String,
  },
  forgotPasswordToken:
  {
    type:String,
  },
  forgotPasswordExpiry:
  {
    type:Date,
  },
  emailVerificationToken:
  {
    type:String,
  },
  emailVerificationExpiry:
  {
    type:Date,
  }
},{ timestamps:true})

const User=mongoose.model("User",userSchema)
module.exports=User