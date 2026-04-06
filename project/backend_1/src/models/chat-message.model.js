const mongoose = require("mongoose")

const chatMessageSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        senderName: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    { timestamps: true }
)
chatMessageSchema.index({ roomId: 1, createdAt: -1 })
const chatMessageModel = mongoose.model("ChatMessage", chatMessageSchema)
module.exports = chatMessageModel