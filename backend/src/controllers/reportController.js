const Report = require("../models/modelReport");
const { sendNotification } = require("../utils/notificationHelper");
const User = require("../models/modelUser");
 
function getIO() {
  return global.__io || null;
}
 
const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
 
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin báo cáo" });
    }
 
    if (!["user", "product", "blog", "comment", "message"].includes(targetType)) {
      return res.status(400).json({ message: "Loại đối tượng báo cáo không hợp lệ" });
    }
 
    const existingReport = await Report.findOne({
      reporterId: req.user._id,
      targetType,
      targetId,
    });
 
    if (existingReport) {
      return res.status(400).json({
        message: `Bạn đã báo cáo ${targetType === "product" ? "bài đăng" : "đối tượng"} này rồi!`,
      });
    }
 
    const report = new Report({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
    });
 
    await report.save();
 
    try {
      const managers = await User.find({ role: { $in: ["manager", "admin"] } }).select("_id");
      const targetLabel =
        targetType === "product" ? "bài đăng" :
        targetType === "user" ? "người dùng" :
        targetType === "message" ? "tin nhắn" : targetType;
 
      for (const mgr of managers) {
        sendNotification(getIO(), {
          userId: String(mgr._id),
          type: "report_received",
          title: "Có báo cáo mới",
          message: `Người dùng vừa gửi báo cáo về ${targetLabel}. Lý do: ${reason}`,
          data: {},
        });
      }
    } catch (notiErr) {
      console.error("[Report] Không gửi được thông báo manager:", notiErr.message);
    }
 
    res.status(201).json({ message: "Gửi báo cáo thành công", report });
  } catch (error) {
    res.status(500).json({ message: "Không thể gửi báo cáo", error: error.message });
  }
};
 
module.exports = { createReport };
 