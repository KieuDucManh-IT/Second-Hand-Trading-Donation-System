const escrowService = require("../services/escrowService");
 
function getUserId(req) {
  return req.user?._id || req.user?.id || req.userId;
}
 
// Buyer thanh toán qua ví
exports.payOrderByWallet = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const order = await escrowService.payOrderByWallet(orderId, userId);
    res.json({ success: true, message: "Thanh toán bằng ví thành công. Tiền đang được hệ thống giữ.", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể thanh toán bằng ví" });
  }
};
 
// Seller xác nhận đơn hàng
exports.sellerConfirmOrder = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const order = await escrowService.sellerConfirmOrder(orderId, userId);
    res.json({ success: true, message: "Đã xác nhận đơn hàng", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể xác nhận đơn hàng" });
  }
};
 
// Seller cập nhật đang giao
exports.markOrderShipping = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const order = await escrowService.markOrderShipping(orderId, userId);
    res.json({ success: true, message: "Đã cập nhật trạng thái đang giao", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể cập nhật trạng thái" });
  }
};
 
// Seller cập nhật đã giao
exports.markOrderDelivered = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const order = await escrowService.markOrderDelivered(orderId, userId);
    res.json({ success: true, message: "Đã giao hàng. Hệ thống bắt đầu đếm 7 ngày xác nhận.", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể cập nhật đã giao hàng" });
  }
};
 
// Buyer xác nhận đã nhận hàng
exports.buyerConfirmReceived = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const order = await escrowService.buyerConfirmReceived(orderId, userId);
    res.json({ success: true, message: "Đã xác nhận nhận hàng. Tiền đã được chuyển vào ví người bán.", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể xác nhận nhận hàng" });
  }
};
 
// Buyer hoặc seller huỷ đơn + hoàn tiền
exports.cancelOrderAndRefund = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await escrowService.cancelOrderAndRefund(orderId, userId, reason);
    res.json({ success: true, message: "Đã huỷ đơn hàng và hoàn tiền về ví", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể huỷ đơn hàng" });
  }
};
 
// Buyer mở khiếu nại
exports.openOrderDispute = async (req, res) => {
  try {
    const userId  = getUserId(req);
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await escrowService.openOrderDispute(orderId, userId, reason);
    res.json({ success: true, message: "Đã mở khiếu nại. Hệ thống sẽ tạm dừng chuyển tiền.", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể mở khiếu nại" });
  }
};
 
// Admin / cron: chạy auto release thủ công
exports.manualRunAutoRelease = async (req, res) => {
  try {
    const result = await escrowService.autoReleaseExpiredOrders();
    res.json({ success: true, message: "Đã chạy kiểm tra tự động chuyển tiền", result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Không thể chạy auto release" });
  }
};
 