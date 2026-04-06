const mongoose=require("mongoose")
const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")
const crypto=require("crypto")
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
    required:[true,"Password is required"],
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

userSchema.pre("save",async function(){
  if(!this.isModified("password")) return
  this.password=await bcrypt.hash(this.password,10)
})
userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
  return jwt.sign(
    {
      _id:this._id,
      email:this.email,
      name:this.name
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken=function(){
  return jwt.sign(
    {
      _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateTemporaryToken=function()
{
    const unhashedToken=crypto
    .randomBytes(32)
    .toString("hex")
    const hashedToken=crypto
    .createHash("sha256")
    .update(unhashedToken)
    .digest("hex")
    const tokenExpiry=Date.now()+(20*60*1000) //20 mins

    return {unhashedToken,hashedToken,tokenExpiry}
}

const userModel=mongoose.model("User",userSchema)
module.exports=userModel
