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

    // Upload ảnh nếu có
    let shippingProofImages = [];
    if (req.files && req.files.length > 0) {
      const uploadToCloudinary = require("../utils/uploadToCloudinary");
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, { folder: "order-shipping-proofs" });
        shippingProofImages.push({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    }

    const order = await escrowService.markOrderShipping(orderId, userId, shippingProofImages);
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
    const { productId, paymentMethod = "wallet", shippingInfo } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Thiếu productId" });
    }

    const validPaymentMethods = ["wallet", "cod"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ" });
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

    // Kiểm tra buyer đã có đơn hàng đang active cho sản phẩm này chưa
    const existingOrder = await Order.findOne({
      buyerId: userId,
      productId: productId,
      orderStatus: { $nin: ["cancelled", "completed"] },
    });
    if (existingOrder) {
      return res.status(400).json({ success: false, message: "Bạn đã đặt đơn hàng cho sản phẩm này rồi" });
    }

    const order = await Order.create({
      buyerId: userId,
      sellerId: sellerId,
      productId: productId,
      totalPrice: product.price || 0,
      paymentMethod,
      shippingInfo: shippingInfo || undefined,
    });

    // Đặt sản phẩm sang reserved
    product.status = "reserved";
    product.isAvailable = false;
    await product.save();
const { sendNotification } = require("../utils/notificationHelper");
sendNotification(req.app.get("io"), {
  userId: String(order.sellerId),
  type: "order_created",
  title: "Đơn hàng mới",
  message: `Bạn có đơn hàng mới từ người mua. Vui lòng xác nhận đơn hàng.`,
  data: { orderId: order._id },
});
    res.status(201).json({
      success: true,
      message: paymentMethod === "cod"
        ? "Đặt hàng thành công. Bạn sẽ thanh toán tiền mặt khi nhận hàng."
        : "Đặt hàng thành công. Vui lòng thanh toán qua ví để hoàn tất.",
      data: order,
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
    const ProductImage = require("../models/modelProductImage");
    const orders = await Order.find({ buyerId: userId })
      .populate("productId")
      .populate("sellerId", "fullName email avatar userName phone")
      .sort({ createdAt: -1 });

    // Gắn ảnh sản phẩm vào mỗi đơn hàng
    const productIds = orders.map(o => o.productId?._id).filter(Boolean);
    const images = await ProductImage.find({ productId: { $in: productIds } }).sort({ order: 1 });
    const imageMap = {};
    for (const img of images) {
      const pid = String(img.productId);
      if (!imageMap[pid]) imageMap[pid] = [];
      imageMap[pid].push(img);
    }
    const ordersWithImages = orders.map(o => {
      const obj = o.toObject();
      if (obj.productId) obj.productId.images = imageMap[String(obj.productId._id)] || [];
      return obj;
    });

    res.json({ success: true, orders: ordersWithImages });
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
    const ProductImage = require("../models/modelProductImage");
    const orders = await Order.find({ sellerId: userId })
      .populate("productId")
      .populate("buyerId", "fullName email avatar userName phone")
      .sort({ createdAt: -1 });

    const productIds = orders.map(o => o.productId?._id).filter(Boolean);
    const images = await ProductImage.find({ productId: { $in: productIds } }).sort({ order: 1 });
    const imageMap = {};
    for (const img of images) {
      const pid = String(img.productId);
      if (!imageMap[pid]) imageMap[pid] = [];
      imageMap[pid].push(img);
    }
    const ordersWithImages = orders.map(o => {
      const obj = o.toObject();
      if (obj.productId) obj.productId.images = imageMap[String(obj.productId._id)] || [];
      return obj;
    });

    res.json({ success: true, orders: ordersWithImages });
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
    const ProductImage = require("../models/modelProductImage");

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

    const obj = order.toObject();
    if (obj.productId) {
      const images = await ProductImage.find({ productId: obj.productId._id }).sort({ order: 1 });
      obj.productId.images = images;
    }

    res.json({
      success: true,
      order: obj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tải thông tin chi tiết đơn hàng",
    });
  }
};