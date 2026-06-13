const Notification = require("../models/notification.model");

const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      recipientId: data.recipientId,
      recipientRole: data.recipientRole,
      notificationType: data.notificationType,
      title: data.title,
      message: data.message,
      relatedEntityId: data.relatedEntityId,
      relatedEntityType: data.relatedEntityType,
      readStatus: "unread",
      isRead: false,
    });
    return notification;
  } catch (err) {
    console.error("Notification creation failed: ", err.message);
    // Notification failure must not affect the main workflow execution
    return null;
  }
};

const getNotificationsForUser = async (userId) => {
  return await Notification.find({ recipientId: userId }).sort({ createdAt: -1 });
};

const markNotificationAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { readStatus: "read", isRead: true },
    { new: true }
  );
};

const markAllNotificationsAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { readStatus: "read", isRead: true }
  );
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
