const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const projectModel = require("../models/project.model")
const projectTodoModel = require("../models/project-todo.model")
const projectLinkModel = require("../models/project-link.model")

const MAX_TODOS_PER_ROOM = 200
const MAX_LINKS_PER_ROOM = 100

const normalizeToken = (token) => {
    if (!token) return null
    const value = String(token).trim()
    if (!value) return null
    if (value.startsWith("Bearer ")) {
        return value.slice(7)
    }
    return value
}

const getTokenFromHandshake = (socket) => {
    const fromAuth = normalizeToken(socket.handshake?.auth?.token)
    if (fromAuth) return fromAuth

    const fromQuery = normalizeToken(socket.handshake?.query?.token)
    if (fromQuery) return fromQuery

    const fromHeader = normalizeToken(socket.handshake?.headers?.authorization)
    if (fromHeader) return fromHeader

    return null
}

const validateProjectRoom = async (roomId) => {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return null
    }

    return projectModel
        .findById(roomId)
        .select("_id createdBy members.user")
        .lean()
}

const isUserAllowedInProject = (project, userId) => {
    if (!project) return false

    const uid = String(userId)
    if (String(project.createdBy) === uid) {
        return true
    }

    return (project.members || []).some((member) => String(member.user) === uid)
}

const mapTodo = (todo) => ({
    id: todo._id.toString(),
    roomId: todo.roomId.toString(),
    text: todo.text,
    completed: Boolean(todo.completed),
    createdBy: {
        id: todo.createdBy?.id ? todo.createdBy.id.toString() : null,
        name: todo.createdBy?.name || "Unknown"
    },
    completedBy: todo.completedBy?.id
        ? {
            id: todo.completedBy.id.toString(),
            name: todo.completedBy.name || "Unknown"
        }
        : null,
    completedAt: todo.completedAt,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt
})

const getRoomTodos = async (roomId) => {
    const todos = await projectTodoModel
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(MAX_TODOS_PER_ROOM)
        .lean()

    return todos.reverse().map(mapTodo)
}

const normalizeUrl = (value) => {
    const raw = String(value || "").trim()
    if (!raw) return ""

    if (/^https?:\/\//i.test(raw)) {
        return raw
    }

    return `https://${raw}`
}

const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(value)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch (error) {
        return false
    }
}

const mapLink = (link) => ({
    id: link._id.toString(),
    roomId: link.roomId.toString(),
    title: link.title,
    url: link.url,
    note: link.note || "",
    createdBy: {
        id: link.createdBy?.id ? link.createdBy.id.toString() : null,
        name: link.createdBy?.name || "Unknown"
    },
    createdAt: link.createdAt,
    updatedAt: link.updatedAt
})

const getRoomLinks = async (roomId) => {
    const links = await projectLinkModel
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(MAX_LINKS_PER_ROOM)
        .lean()

    return links.reverse().map(mapLink)
}

const ensureRoomAccess = async (socket, roomId) => {
    const project = await validateProjectRoom(roomId)
    if (!project) {
        socket.emit("todo:error", { message: "Invalid project room" })
        return false
    }

    if (!isUserAllowedInProject(project, socket.user.id)) {
        socket.emit("todo:error", { message: "You are not authorized for this project" })
        return false
    }

    return true
}

const setupTodoSocket = (server) => {
    const io = new Server(server, {
        path: "/ws/todo",
        cors: {
            origin: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
                : ["http://localhost:5173", "http://127.0.0.1:5173"],
            credentials: true
        }
    })

    io.use((socket, next) => {
        try {
            const token = getTokenFromHandshake(socket)
            if (!token) {
                return next(new Error("Authentication token missing"))
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            socket.user = {
                id: decoded._id,
                name: decoded.name || "Anonymous"
            }
            return next()
        } catch (error) {
            return next(new Error("Invalid or expired token"))
        }
    })

    io.on("connection", (socket) => {
        const joinTodoRoom = async (roomId) => {
            const isAllowed = await ensureRoomAccess(socket, roomId)
            if (!isAllowed) return

            const previousRoomId = socket.data.roomId
            if (previousRoomId && previousRoomId !== roomId) {
                socket.leave(previousRoomId)
            }

            socket.data.roomId = roomId
            socket.join(roomId)

            const todos = await getRoomTodos(roomId)
            socket.emit("todo:list", { roomId, todos })

            const links = await getRoomLinks(roomId)
            socket.emit("link:list", { roomId, links })
        }

        socket.emit("todo:connected", {
            user: socket.user,
            usage: {
                join: { event: "todo:join", payload: { roomId: "<projectId>" } },
                create: { event: "todo:create", payload: { roomId: "<projectId>", text: "Add API tests" } },
                toggle: { event: "todo:toggle", payload: { roomId: "<projectId>", todoId: "<todoId>", completed: true } },
                linkCreate: {
                    event: "link:create",
                    payload: { roomId: "<projectId>", title: "Node docs", url: "https://nodejs.org/docs" }
                }
            }
        })

        const roomIdFromQuery = socket.handshake?.query?.roomId
        if (roomIdFromQuery) {
            joinTodoRoom(String(roomIdFromQuery)).catch(() => {
                socket.emit("todo:error", { message: "Failed to join todo room" })
            })
        }

        socket.on("todo:join", async (payload = {}) => {
            const roomId = String(payload.roomId || "").trim()
            if (!roomId) {
                socket.emit("todo:error", { message: "roomId is required" })
                return
            }

            await joinTodoRoom(roomId)
        })

        socket.on("todo:create", async (payload = {}) => {
            const roomId = String(payload.roomId || socket.data.roomId || "").trim()
            const text = String(payload.text || "").trim()

            if (!roomId) {
                socket.emit("todo:error", { message: "roomId is required to create todo" })
                return
            }

            if (!text) {
                socket.emit("todo:error", { message: "Todo text is required" })
                return
            }

            const isAllowed = await ensureRoomAccess(socket, roomId)
            if (!isAllowed) return

            socket.data.roomId = roomId
            socket.join(roomId)

            const savedTodo = await projectTodoModel.create({
                roomId,
                text,
                createdBy: {
                    id: socket.user.id,
                    name: socket.user.name
                }
            })

            io.to(roomId).emit("todo:created", {
                roomId,
                todo: mapTodo(savedTodo)
            })
        })

        socket.on("todo:toggle", async (payload = {}) => {
            const roomId = String(payload.roomId || socket.data.roomId || "").trim()
            const todoId = String(payload.todoId || "").trim()
            const completed = Boolean(payload.completed)

            if (!roomId) {
                socket.emit("todo:error", { message: "roomId is required to update todo" })
                return
            }

            if (!todoId || !mongoose.Types.ObjectId.isValid(todoId)) {
                socket.emit("todo:error", { message: "A valid todoId is required" })
                return
            }

            const isAllowed = await ensureRoomAccess(socket, roomId)
            if (!isAllowed) return

            const todo = await projectTodoModel.findById(todoId)
            if (!todo || String(todo.roomId) !== roomId) {
                socket.emit("todo:error", { message: "Todo item not found in this project" })
                return
            }

            todo.completed = completed
            if (completed) {
                todo.completedBy = {
                    id: socket.user.id,
                    name: socket.user.name
                }
                todo.completedAt = new Date()
            } else {
                todo.completedBy = {
                    id: null,
                    name: null
                }
                todo.completedAt = null
            }

            await todo.save()

            io.to(roomId).emit("todo:updated", {
                roomId,
                todo: mapTodo(todo)
            })
        })

        socket.on("link:create", async (payload = {}) => {
            const roomId = String(payload.roomId || socket.data.roomId || "").trim()
            const title = String(payload.title || "").trim()
            const url = normalizeUrl(payload.url)
            const note = String(payload.note || "").trim()

            if (!roomId) {
                socket.emit("todo:error", { message: "roomId is required to save link" })
                return
            }

            if (!title) {
                socket.emit("todo:error", { message: "Link title is required" })
                return
            }

            if (!url || !isValidHttpUrl(url)) {
                socket.emit("todo:error", { message: "Please provide a valid http/https link" })
                return
            }

            const isAllowed = await ensureRoomAccess(socket, roomId)
            if (!isAllowed) return

            socket.data.roomId = roomId
            socket.join(roomId)

            const savedLink = await projectLinkModel.create({
                roomId,
                title,
                url,
                note,
                createdBy: {
                    id: socket.user.id,
                    name: socket.user.name
                }
            })

            io.to(roomId).emit("link:created", {
                roomId,
                link: mapLink(savedLink)
            })
        })
    })

    return io
}

module.exports = { setupTodoSocket }
