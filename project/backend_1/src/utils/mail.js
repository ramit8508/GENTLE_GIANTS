const Mailgen = require("mailgen")
const nodemailer = require("nodemailer")

const getTransportConfig = () => {
    const host = process.env.EMAIL_HOST
    const port = Number(process.env.EMAIL_PORT || 587)
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS

    if (!host || !user || !pass) {
        throw new Error("Email config missing. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS in .env")
    }

    return {
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    }
}

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "CollabHub",
            link: "https://collabhub.com",
        },
    })

    const emailHtml = mailGenerator.generate(options.mailgenContent)
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const transporter = nodemailer.createTransport(getTransportConfig())

    const fromName = process.env.EMAIL_FROM_NAME || "CollabHub"
    const fromEmail = process.env.EMAIL_USER

    const mail = {
        from: `${fromName} <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        html: emailHtml,
        text: emailTextual,
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.log("Error in sending email:", error)
        throw error
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