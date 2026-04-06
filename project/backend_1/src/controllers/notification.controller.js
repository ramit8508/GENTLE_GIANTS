const mongoose = require("mongoose")
const notificationModel = require("../models/notification.model")
const ApiError = require("../utils/api-error")
const ApiResponse = require("../utils/api-response")

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel
            .find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate("actor", "name email")
            .populate("project", "title")

        const unreadCount = notifications.filter((item) => !item.isRead).length

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    notifications,
                    unreadCount
                },
                "Notifications fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while fetching notifications")
    }
}

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(String(id))) {
            throw new ApiError(400, "Invalid notification id")
        }

        const notification = await notificationModel.findOneAndUpdate(
            { _id: id, recipient: req.user._id },
            { $set: { isRead: true } },
            { new: true }
        )

        if (!notification) {
            throw new ApiError(404, "Notification not found")
        }

        return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while updating notification")
    }
}

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await notificationModel.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        )

        return res.status(200).json(
            new ApiResponse(
                200,
                { updatedCount: result.modifiedCount || 0 },
                "All notifications marked as read"
            )
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while updating notifications")
    }
}

module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
}
