const notificationModel = require("../models/notification.model");
const ApiError = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const createNotification = async ({ recipient, sender, project, type, message }) => {
    try {
        if (!recipient) return;        
        if (sender && String(sender) === String(recipient)) return;
        await notificationModel.create({
            recipient,
            sender,
            project,
            type,
            message,
        });
    } catch (error) {
        console.error("Error creating notification:", error.message);
    }
};

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel
            .find({ recipient: req.user._id })
            .populate("sender", "name")
            .populate("project", "title")
            .sort({ createdAt: -1 });

        return res.status(200).json(new ApiResponse(200, "Notifications fetched successfully", notifications));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching notifications", error.message);
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await notificationModel.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        return res.status(200).json(new ApiResponse(200, "Notification marked as read", notification));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, "Something went wrong while updating notification", error.message);
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await notificationModel.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        return res.status(200).json(new ApiResponse(200, "All notifications marked as read", null));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating notifications", error.message);
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
};
