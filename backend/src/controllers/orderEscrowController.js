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

// Cron: tự động huỷ đơn pending quá 24h chưa thanh toán
exports.manualRunAutoCancelPending = async (req, res) => {
  try {
    const result = await escrowService.autoCancelExpiredPendingOrders();
    res.json({ success: true, message: "Đã huỷ các đơn hàng quá hạn thanh toán", result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Không thể chạy auto cancel" });
  }
};

// Buyer đánh giá người bán sau khi đơn hoàn thành
exports.rateSeller = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;
    const { rating, comment } = req.body;
    const order = await escrowService.rateSeller(orderId, userId, rating, comment);
    res.json({ success: true, message: "Đã đánh giá người bán thành công", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Không thể đánh giá" });
  }
};

const Order = require("../models/modelOrder");
const Product = require("../models/modelProduct");

exports.createOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Thiếu productId" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    if (product.status !== "available") {
      return res.status(400).json({ success: false, message: "Sản phẩm không còn sẵn sàng" });
    }

    const sellerId = product.ownerId || product.userId || product.seller;
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Sản phẩm thiếu thông tin người bán" });
    }

    if (String(sellerId) === String(userId)) {
      return res.status(400).json({ success: false, message: "Bạn không thể tự mua sản phẩm của chính mình" });
    }

    const order = await Order.create({
      buyerId: userId,
      sellerId: sellerId,
      productId: productId,
      totalPrice: product.price || 0,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Đã tạo đơn hàng thành công",
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Không thể tạo đơn hàng",
    });
  }
};

exports.getMyBuyingOrders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const orders = await Order.find({ buyerId: userId })
      .populate("productId")
      .populate("sellerId", "fullName email avatar userName phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tải danh sách đơn hàng đã mua",
    });
  }
};

exports.getMySellingOrders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const orders = await Order.find({ sellerId: userId })
      .populate("productId")
      .populate("buyerId", "fullName email avatar userName phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tải danh sách đơn hàng đã bán",
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("productId")
      .populate("buyerId", "fullName email avatar userName phone")
      .populate("sellerId", "fullName email avatar userName phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (String(order.buyerId._id) !== String(userId) && String(order.sellerId._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này" });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tải thông tin chi tiết đơn hàng",
    });
  }
};