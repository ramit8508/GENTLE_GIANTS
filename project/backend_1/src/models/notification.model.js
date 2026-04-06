const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        },
        type: {
            type: String,
            enum: [
                "join_request",
                "join_request_accepted",
                "join_request_rejected",
                "invite_received",
                "invite_accepted",
                "invite_rejected",
                "removed_from_project"
            ],
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 400
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
)

const notificationModel = mongoose.model("Notification", notificationSchema)

module.exports = notificationModel
