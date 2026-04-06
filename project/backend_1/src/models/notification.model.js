const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },
        type: {
            type: String,
            required: true,
            enum: [
                "join_request",
                "request_accepted",
                "request_rejected",
                "invitation",
                "invitation_accepted",
                "invitation_rejected",
                "member_removed",
                "general",
            ],
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const notificationModel = mongoose.model("Notification", notificationSchema);
module.exports = notificationModel;
