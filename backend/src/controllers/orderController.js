const Order   = require("../models/modelOrder");
const Product = require("../models/modelProduct");
 
// ── POST /api/orders ──────────────────────────────────────────────────────────
// Buyer tạo đơn hàng cho sản phẩm type="sell"
exports.createOrder = async (req, res, next) => {
  try {
    const { productId, paymentMethod = "wallet", shippingInfo } = req.body;
    const buyerId = req.user._id;
 
    // 1. Lấy sản phẩm
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
 
    // 2. Kiểm tra điều kiện
    if (product.type !== "sell")
      return res.status(400).json({ success: false, message: "Sản phẩm này không hỗ trợ mua bán" });
    if (!product.isAvailable || product.status !== "available")
      return res.status(400).json({ success: false, message: "Sản phẩm không còn khả dụng" });
    if (product.ownerId.toString() === buyerId.toString())
      return res.status(400).json({ success: false, message: "Bạn không thể mua sản phẩm của chính mình" });
 
    const validPaymentMethods = ["wallet", "cod"];
    if (!validPaymentMethods.includes(paymentMethod))
      return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ" });
 
    // 3. Tạo đơn hàng (phí tự tính trong pre-validate hook)
    const order = await Order.create({
      buyerId,
      sellerId:      product.ownerId,
      productId:     product._id,
      totalPrice:    product.price,
      paymentMethod,
      shippingInfo:  shippingInfo || undefined,
      // paymentStatus mặc định "unpaid", orderStatus mặc định "pending_seller_confirm"
    });
 
    // 4. Đặt sản phẩm sang "reserved"
    product.status      = "reserved";
    product.isAvailable = false;
    await product.save();
 
    // 5. Populate để trả về thông tin đầy đủ
    await order.populate([
      { path: "productId", select: "title price condition thumbnail" },
      { path: "sellerId",  select: "fullName email" },
    ]);
 
    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "wallet"
          ? "Đặt hàng thành công. Vui lòng thanh toán qua ví để hoàn tất."
          : "Đặt hàng thành công. Chờ seller xác nhận.",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
 
// ── GET /api/orders/my-purchases ─────────────────────────────────────────────
exports.getMyPurchases = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("productId", "title price thumbnail condition")
      .populate("sellerId", "fullName");
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};
 
// ── GET /api/orders/my-sales ──────────────────────────────────────────────────
exports.getMySales = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("productId", "title price thumbnail condition")
      .populate("buyerId", "fullName");
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};
 
// ── GET /api/orders/:id ───────────────────────────────────────────────────────
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId", "title price thumbnail condition location")
      .populate("buyerId",   "fullName email")
      .populate("sellerId",  "fullName email");
 
    if (!order)
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
 
    const userId = req.user._id.toString();
    const canView =
      order.buyerId._id.toString() === userId ||
      order.sellerId._id.toString() === userId ||
      req.user.role === "manager";
 
    if (!canView)
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này" });
 
    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};