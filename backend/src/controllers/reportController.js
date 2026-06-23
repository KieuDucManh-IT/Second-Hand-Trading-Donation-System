const Report = require("../models/modelReport");

const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin báo cáo" });
    }

    if (!["user", "product", "blog", "comment", "message"].includes(targetType)) {
      return res.status(400).json({ message: "Loại đối tượng báo cáo không hợp lệ" });
    }

    const report = new Report({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
    });

    await report.save();

    res.status(201).json({ message: "Gửi báo cáo thành công", report });
  } catch (error) {
    res.status(500).json({ message: "Không thể gửi báo cáo", error: error.message });
  }
};

module.exports = {
  createReport,
};
