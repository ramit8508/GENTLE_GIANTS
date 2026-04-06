require('dotenv').config()
const app=require("./src/app")
const http = require("http")
const { setupChatWebSocket } = require("./src/socket/chat.socket")
const PORT=process.env.PORT || 3000
const connectDB=require("./src/db/db")
connectDB()
const server = http.createServer(app)
setupChatWebSocket(server)

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})