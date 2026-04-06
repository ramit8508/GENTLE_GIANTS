const express = require("express");
const notificationControllers = require("../controllers/notification.controller");
const { authmiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authmiddleware); // Protect all notification routes

router.route("/").get(notificationControllers.getNotifications);
router.route("/read-all").patch(notificationControllers.markAllAsRead);
router.route("/:id/read").patch(notificationControllers.markAsRead);

module.exports = router;
