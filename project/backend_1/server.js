const path = require("path")
const fs = require("fs")
const dotenv = require("dotenv")

const envPath = path.join(__dirname, ".env")
dotenv.config({ path: envPath })

// Some environments pre-inject variables from a different .env (cwd-based).
// Merge backend_1/.env values explicitly so local backend config is always available.
if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath))
    Object.entries(parsed).forEach(([key, value]) => {
        const current = process.env[key]
        if (
            current === undefined ||
            current === null ||
            current === "" ||
            String(current).toLowerCase() === "undefined" ||
            String(current).toLowerCase() === "null"
        ) {
            process.env[key] = value
        }
    })
}
const app=require("./src/app")
const http = require("http")
const { setupChatWebSocket } = require("./src/socket/chat.socket")
const { setupTodoSocket } = require("./src/socket/todo.socket")
const PORT=process.env.PORT || 3000
const connectDB=require("./src/db/db")
connectDB()
const server = http.createServer(app)
setupChatWebSocket(server)
setupTodoSocket(server)

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})