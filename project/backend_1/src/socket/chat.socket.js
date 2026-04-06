const { WebSocketServer } = require("ws")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const projectModel = require("../models/project.model")

const rooms = new Map()
const messageHistory = new Map()

const MAX_MESSAGES_PER_ROOM = 50

const sendJson = (ws, payload) => {
    if (ws.readyState === 1) {
        ws.send(JSON.stringify(payload))
    }
}

const getTokenFromRequest = (req, parsedUrl) => {
    const queryToken = parsedUrl.searchParams.get("token")
    if (queryToken) return queryToken

    const authHeader = req.headers?.authorization
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7)
    }

    const cookieHeader = req.headers?.cookie || ""
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim())
    const accessTokenCookie = cookies.find((cookie) => cookie.startsWith("accessToken="))
    if (accessTokenCookie) {
        return decodeURIComponent(accessTokenCookie.split("=")[1])
    }

    return null
}

const getRoomSockets = (roomId) => {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set())
    }
    return rooms.get(roomId)
}

const addToHistory = (roomId, message) => {
    if (!messageHistory.has(roomId)) {
        messageHistory.set(roomId, [])
    }
    const history = messageHistory.get(roomId)
    history.push(message)
    if (history.length > MAX_MESSAGES_PER_ROOM) {
        history.shift()
    }
}

const broadcastToRoom = (roomId, payload) => {
    const roomSockets = rooms.get(roomId)
    if (!roomSockets) return

    roomSockets.forEach((client) => {
        sendJson(client, payload)
    })
}

const leaveRoom = (ws) => {
    if (!ws.roomId) return
    const roomId = ws.roomId
    const roomSockets = rooms.get(roomId)

    if (roomSockets) {
        roomSockets.delete(ws)
        if (roomSockets.size === 0) {
            rooms.delete(roomId)
        }
    }

    ws.roomId = null
}

const validateProjectRoom = async (roomId) => {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return false
    }
    const exists = await projectModel.exists({ _id: roomId })
    return Boolean(exists)
}

const joinRoom = async (ws, roomId) => {
    const isValidRoom = await validateProjectRoom(roomId)
    if (!isValidRoom) {
        sendJson(ws, {
            type: "error",
            message: "Invalid roomId. It must be an existing project id."
        })
        return
    }

    if (ws.roomId && ws.roomId !== roomId) {
        leaveRoom(ws)
    }

    ws.roomId = roomId
    const roomSockets = getRoomSockets(roomId)
    roomSockets.add(ws)

    const history = messageHistory.get(roomId) || []
    sendJson(ws, {
        type: "history",
        roomId,
        messages: history
    })

    broadcastToRoom(roomId, {
        type: "system",
        roomId,
        message: `${ws.user.name} joined the room`
    })
}

const setupChatWebSocket = (server) => {
    const wss = new WebSocketServer({ server, path: "/ws/chat" })

    wss.on("connection", async (ws, req) => {
        try {
            const parsedUrl = new URL(req.url, "http://localhost")
            const token = getTokenFromRequest(req, parsedUrl)
            if (!token) {
                sendJson(ws, { type: "error", message: "Authentication token missing" })
                ws.close(4001, "Unauthorized")
                return
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            ws.user = {
                id: decoded._id,
                name: decoded.name || "Anonymous"
            }
            ws.roomId = null

            sendJson(ws, {
                type: "connected",
                user: ws.user,
                usage: {
                    path: "/ws/chat",
                    join: { type: "join", roomId: "<projectId>" },
                    send: { type: "send_message", content: "Hello" }
                }
            })

            const roomIdFromQuery = parsedUrl.searchParams.get("roomId")
            if (roomIdFromQuery) {
                await joinRoom(ws, roomIdFromQuery)
            }

            ws.on("message", async (raw) => {
                try {
                    const data = JSON.parse(raw.toString())
                    if (data.type === "join") {
                        if (!data.roomId) {
                            sendJson(ws, { type: "error", message: "roomId is required" })
                            return
                        }
                        await joinRoom(ws, data.roomId)
                        return
                    }

                    if (data.type === "send_message") {
                        const content = String(data.content || "").trim()
                        if (!ws.roomId) {
                            sendJson(ws, { type: "error", message: "Join a room before sending messages" })
                            return
                        }
                        if (!content) {
                            sendJson(ws, { type: "error", message: "Message content is required" })
                            return
                        }

                        const message = {
                            id: new mongoose.Types.ObjectId().toString(),
                            roomId: ws.roomId,
                            content,
                            sender: {
                                id: ws.user.id,
                                name: ws.user.name
                            },
                            createdAt: new Date().toISOString()
                        }

                        addToHistory(ws.roomId, message)
                        broadcastToRoom(ws.roomId, {
                            type: "new_message",
                            roomId: ws.roomId,
                            message
                        })
                        return
                    }

                    sendJson(ws, { type: "error", message: "Unknown event type" })
                } catch (error) {
                    sendJson(ws, { type: "error", message: "Invalid message payload" })
                }
            })

            ws.on("close", () => {
                const roomId = ws.roomId
                leaveRoom(ws)
                if (roomId) {
                    broadcastToRoom(roomId, {
                        type: "system",
                        roomId,
                        message: `${ws.user.name} left the room`
                    })
                }
            })
        } catch (error) {
            sendJson(ws, { type: "error", message: "Invalid or expired token" })
            ws.close(4001, "Unauthorized")
        }
    })

    return wss
}

module.exports = { setupChatWebSocket }