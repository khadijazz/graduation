const notificationService = require("../services/notification.services");
const { ApiError } = require("../Utills/ApiError");

exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.user._id);
    res.status(200).json({
      status: "success",
      message: "Notifications retrieved successfully",
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id, req.user._id);
    if (!notification) {
      throw new ApiError("Notification not found or unauthorized", 404);
    }
    res.status(200).json({
      status: "success",
      message: "Notification marked as read successfully",
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsAsRead(req.user._id);
    res.status(200).json({
      status: "success",
      message: "All notifications marked as read successfully",
      data: null
    });
  } catch (error) {
    next(error);
  }
};
