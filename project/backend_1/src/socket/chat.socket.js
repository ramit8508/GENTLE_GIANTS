const { WebSocketServer } = require("ws")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const projectModel = require("../models/project.model")
const chatMessageModel = require("../models/chat-message.model")
const callLogModel = require("../models/call-log.model")

const rooms = new Map()
const activeCalls = new Map()

const MAX_MESSAGES_PER_ROOM = 50
const MAX_CALL_PARTICIPANTS = Number(process.env.MAX_CALL_PARTICIPANTS || 8)
const CALL_TYPES = new Set(["voice", "video"])

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

const getSessionParticipantPayload = (session) => {
    return Array.from(session.participants.values()).map((participant) => ({
        userId: participant.userId,
        name: participant.name,
        joinedAt: participant.joinedAt,
        isMuted: participant.isMuted,
        isVideoEnabled: participant.isVideoEnabled
    }))
}

const getActiveCallSession = (roomId) => activeCalls.get(roomId) || null

const getOrCreateCallSession = (roomId, callType, initiatedBy) => {
    let session = activeCalls.get(roomId)
    if (!session) {
        session = {
            roomId,
            callType,
            initiatedBy,
            startedAt: new Date(),
            participants: new Map(),
            hasPersisted: false
        }
        activeCalls.set(roomId, session)
    }
    return session
}

const sendToUserInRoom = (roomId, userId, payload) => {
    const roomSockets = rooms.get(roomId)
    if (!roomSockets) return

    roomSockets.forEach((client) => {
        if (client.user?.id === userId) {
            sendJson(client, payload)
        }
    })
}

const broadcastToRoomExceptUser = (roomId, excludedUserId, payload) => {
    const roomSockets = rooms.get(roomId)
    if (!roomSockets) return

    roomSockets.forEach((client) => {
        if (client.user?.id !== excludedUserId) {
            sendJson(client, payload)
        }
    })
}

const persistEndedCallSession = async (session, endReason) => {
    if (!session || session.hasPersisted) return

    const endedAt = new Date()
    const durationSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)
    )

    const participants = Array.from(session.participants.values()).map((participant) => ({
        userId: participant.userId,
        name: participant.name,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt || endedAt
    }))

    await callLogModel.create({
        roomId: session.roomId,
        initiatedBy: session.initiatedBy,
        callType: session.callType,
        participants,
        startedAt: session.startedAt,
        endedAt,
        durationSeconds,
        endReason
    })

    session.hasPersisted = true
}

const removeParticipantFromCall = async (ws, reason) => {
    const roomId = ws.roomId
    if (!roomId) return

    const session = activeCalls.get(roomId)
    if (!session) return

    const participant = session.participants.get(ws.user.id)
    if (!participant) return

    participant.leftAt = new Date()
    session.participants.set(ws.user.id, participant)

    broadcastToRoom(roomId, {
        type: "call:participant_left",
        roomId,
        userId: ws.user.id,
        name: ws.user.name,
        reason
    })

    if (session.participants.size <= 1) {
        await persistEndedCallSession(session, "all_left")
        activeCalls.delete(roomId)
        broadcastToRoom(roomId, {
            type: "call:ended",
            roomId,
            reason: "all_left"
        })
        return
    }

    session.participants.delete(ws.user.id)
    activeCalls.set(roomId, session)
}

const getRoomHistory = async (roomId) => {
    const docs = await chatMessageModel
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(MAX_MESSAGES_PER_ROOM)
        .lean()

    return docs
        .reverse()
        .map((doc) => ({
            id: doc._id.toString(),
            roomId: doc.roomId.toString(),
            content: doc.content,
            sender: {
                id: doc.senderId.toString(),
                name: doc.senderName
            },
            createdAt: doc.createdAt
        }))
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

const joinRoom = async (ws, roomId) => {
    const project = await validateProjectRoom(roomId)
    if (!project) {
        sendJson(ws, {
            type: "error",
            message: "Invalid roomId. It must be an existing project id."
        })
        return
    }

    if (!isUserAllowedInProject(project, ws.user.id)) {
        sendJson(ws, {
            type: "error",
            message: "You are not authorized to join this room."
        })
        return
    }

    if (ws.roomId && ws.roomId !== roomId) {
        await removeParticipantFromCall(ws, "room_change")
        leaveRoom(ws)
    }

    ws.roomId = roomId
    const roomSockets = getRoomSockets(roomId)
    roomSockets.add(ws)

    const history = await getRoomHistory(roomId)
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
            ws.connectionId = new mongoose.Types.ObjectId().toString()
            ws.roomId = null

            sendJson(ws, {
                type: "connected",
                user: ws.user,
                usage: {
                    path: "/ws/chat",
                    join: { type: "join", roomId: "<projectId>" },
                    send: { type: "send_message", content: "Hello" },
                    callJoin: { type: "call:join", roomId: "<projectId>", callType: "video" },
                    callSignal: { type: "call:offer", roomId: "<projectId>", targetUserId: "<userId>", sdp: {} }
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

                        const savedMessage = await chatMessageModel.create({
                            roomId: ws.roomId,
                            senderId: ws.user.id,
                            senderName: ws.user.name,
                            content
                        })

                        const message = {
                            id: savedMessage._id.toString(),
                            roomId: ws.roomId,
                            content: savedMessage.content,
                            sender: {
                                id: savedMessage.senderId.toString(),
                                name: savedMessage.senderName
                            },
                            createdAt: savedMessage.createdAt
                        }

                        broadcastToRoom(ws.roomId, {
                            type: "new_message",
                            roomId: ws.roomId,
                            message
                        })
                        return
                    }

                    if (data.type === "call:join") {
                        const roomId = data.roomId || ws.roomId
                        const callType = CALL_TYPES.has(data.callType) ? data.callType : "video"

                        if (!roomId) {
                            sendJson(ws, { type: "error", message: "roomId is required to join a call" })
                            return
                        }

                        if (ws.roomId !== roomId) {
                            await joinRoom(ws, roomId)
                        }

                        if (ws.roomId !== roomId) {
                            return
                        }

                        const session = getOrCreateCallSession(roomId, callType, ws.user.id)

                        if (!session.participants.has(ws.user.id) && session.participants.size >= MAX_CALL_PARTICIPANTS) {
                            sendJson(ws, { type: "error", message: "Call participant limit reached" })
                            return
                        }

                        const previous = session.participants.get(ws.user.id)
                        session.participants.set(ws.user.id, {
                            userId: ws.user.id,
                            name: ws.user.name,
                            joinedAt: previous?.joinedAt || new Date(),
                            leftAt: null,
                            isMuted: previous?.isMuted || false,
                            isVideoEnabled: previous?.isVideoEnabled ?? callType === "video"
                        })

                        activeCalls.set(roomId, session)

                        sendJson(ws, {
                            type: "call:joined",
                            roomId,
                            callType: session.callType,
                            participants: getSessionParticipantPayload(session)
                        })

                        broadcastToRoomExceptUser(roomId, ws.user.id, {
                            type: "call:participant_joined",
                            roomId,
                            userId: ws.user.id,
                            name: ws.user.name
                        })
                        return
                    }

                    if (data.type === "call:offer" || data.type === "call:answer" || data.type === "call:ice-candidate") {
                        const roomId = data.roomId || ws.roomId
                        if (!roomId) {
                            sendJson(ws, { type: "error", message: "roomId is required for call signaling" })
                            return
                        }

                        const session = getActiveCallSession(roomId)
                        if (!session || !session.participants.has(ws.user.id)) {
                            sendJson(ws, { type: "error", message: "Join the call before signaling" })
                            return
                        }

                        const payload = {
                            type: data.type,
                            roomId,
                            fromUserId: ws.user.id,
                            fromUserName: ws.user.name,
                            sdp: data.sdp,
                            candidate: data.candidate
                        }

                        if (data.targetUserId) {
                            sendToUserInRoom(roomId, data.targetUserId, payload)
                        } else {
                            broadcastToRoomExceptUser(roomId, ws.user.id, payload)
                        }
                        return
                    }

                    if (data.type === "call:mute-toggle" || data.type === "call:video-toggle") {
                        const roomId = data.roomId || ws.roomId
                        const session = getActiveCallSession(roomId)
                        if (!session || !session.participants.has(ws.user.id)) {
                            sendJson(ws, { type: "error", message: "Join the call before updating call state" })
                            return
                        }

                        const participant = session.participants.get(ws.user.id)
                        if (data.type === "call:mute-toggle") {
                            participant.isMuted = Boolean(data.isMuted)
                        } else {
                            participant.isVideoEnabled = Boolean(data.isVideoEnabled)
                        }
                        session.participants.set(ws.user.id, participant)
                        activeCalls.set(roomId, session)

                        broadcastToRoom(roomId, {
                            type: "call:participant_updated",
                            roomId,
                            userId: ws.user.id,
                            isMuted: participant.isMuted,
                            isVideoEnabled: participant.isVideoEnabled
                        })
                        return
                    }

                    if (data.type === "call:leave") {
                        await removeParticipantFromCall(ws, "manual")
                        return
                    }

                    if (data.type === "call:end") {
                        const roomId = data.roomId || ws.roomId
                        const session = getActiveCallSession(roomId)
                        if (!session || !session.participants.has(ws.user.id)) {
                            sendJson(ws, { type: "error", message: "No active call to end" })
                            return
                        }

                        await persistEndedCallSession(session, "manual")
                        activeCalls.delete(roomId)

                        broadcastToRoom(roomId, {
                            type: "call:ended",
                            roomId,
                            reason: "manual",
                            endedBy: ws.user.id
                        })
                        return
                    }

                    sendJson(ws, { type: "error", message: "Unknown event type" })
                } catch (error) {
                    sendJson(ws, { type: "error", message: "Invalid message payload" })
                }
            })

            ws.on("close", async () => {
                const roomId = ws.roomId
                await removeParticipantFromCall(ws, "disconnect")
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