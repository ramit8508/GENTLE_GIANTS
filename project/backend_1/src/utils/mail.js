const Mailgen=require("mailgen")
const nodemailer=require("nodemailer")
const sendEmail=async(options)=>{
   const mailGenerator= new Mailgen({
        theme:"default",
        product:{
            name:"CollabHub",
            link:"https://collabhub.com"
        }
    })
    const emailHtml=mailGenerator.generate(options.mailgenContent)
    const emailTextual=mailGenerator.generatePlaintext(options.mailgenContent)
    const transporter=nodemailer.createTransport({
        host:process.env.MAILTRAP_SMTP_HOST,
        port:process.env.MAILTRAP_SMTP_PORT,
        auth:{
            user:process.env.MAILTRAP_SMTP_USER,
            pass:process.env.MAILTRAP_SMTP_PASS
        }
    })
    const mail={
        from:"CollabHub",
        to:options.email,
        subject:options.subject,
        html:emailHtml,
        text:emailTextual
    }
   try {
     await transporter.sendMail(mail)
   } catch (error) {
    console.log("Error in sending email:",error)
   }
}
const emailVerificationMailgenContent= (username,verificationUrl)=>
{
    return{
        body:{
            name:username,
            intro:"Welcome to our platform",
            action:{
                instructions:"Please click the button below to verify your email",
                button:{
                    color:"#00dc12ff",
                    text:"Verify Email",
                    link:verificationUrl
                }
            },
            outro:"If you did not create this account, please ignore this email"
        }
    }
}
const forgotPasswordMailgenContent= (username,passwordResetUrl)=>{
    return{
        body:{
            name:username,
            intro:"We got a request to reset the password of your account",
            action:{
                instructions:"Please click the button below to reset your password",
                button:{
                    color:"#00dc12ff",
                    text:"Reset Password",
                    link:passwordResetUrl
                }
            },
            outro:"If you did not create this account, please ignore this email"
        }
    }
}
module.exports={emailVerificationMailgenContent,forgotPasswordMailgenContent,sendEmail}