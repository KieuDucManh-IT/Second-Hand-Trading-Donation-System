
 
const Notification = require("../models/modelNotification");
 

async function sendNotification(io, { userId, type, title, message, data = {} }) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });
 
    if (io) {
      io.to(`user:${userId}`).emit("notification", {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: false,
        createdAt: notification.createdAt,
      });
    }
 
    return notification;
  } catch (err) {
    console.error("[Notification] Lỗi gửi thông báo:", err.message);
  }
}
 

async function sendNotificationMany(io, userIds, payload) {
  return Promise.all(userIds.map((uid) => sendNotification(io, { ...payload, userId: uid })));
}
 
module.exports = { sendNotification, sendNotificationMany };
 