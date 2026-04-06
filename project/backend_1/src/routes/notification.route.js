const express = require("express")
const { authmiddleware } = require("../middlewares/auth.middleware")
const notificationControllers = require("../controllers/notification.controller")

const router = express.Router()

router.route("/").get(authmiddleware, notificationControllers.getMyNotifications)
router.route("/read-all").patch(authmiddleware, notificationControllers.markAllNotificationsAsRead)
router.route("/:id/read").patch(authmiddleware, notificationControllers.markNotificationAsRead)

module.exports = router
