
 
const Notification = require("../models/modelNotification");
 
/**
 * Tạo thông báo + emit socket tới user
 *
 * @param {Object} io           - Socket.IO server instance (app.get('io'))
 * @param {Object} options
 * @param {string} options.userId   - ID người nhận
 * @param {string} options.type     - Loại thông báo (khớp enum trong model)
 * @param {string} options.title    - Tiêu đề
 * @param {string} options.message  - Nội dung
 * @param {Object} [options.data]   - { orderId, amount, currency }
 */
async function sendNotification(io, { userId, type, title, message, data = {} }) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });
 
    // Emit tới room riêng của user (user:${userId})
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
 
/**
 * Gửi thông báo cho nhiều user cùng lúc
 */
async function sendNotificationMany(io, userIds, payload) {
  return Promise.all(userIds.map((uid) => sendNotification(io, { ...payload, userId: uid })));
}
 
module.exports = { sendNotification, sendNotificationMany };
 