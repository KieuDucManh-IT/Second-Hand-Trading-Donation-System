const Notification = require("../models/modelNotification");
 
function getUserId(req) {
  return req.user?._id || req.user?.id || req.userId;
}
 
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
 
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);
 
    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
 
exports.markOneRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
 
    const noti = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
 
    if (!noti) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
 
    res.json({ success: true, notification: noti });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
 
exports.markAllRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    await Notification.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
 
exports.deleteOne = async (req, res) => {
  try {
    const userId = getUserId(req);
    await Notification.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true, message: "Đã xoá thông báo" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
 