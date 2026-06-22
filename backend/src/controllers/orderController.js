const mongoose = require('mongoose');
const Order   = require('../models/modelOrder');
const Product = require('../models/modelProduct');
const User    = require('../models/modelUser');
 
// ── POST /api/orders ──────────────────────────────────────────────────────────
// Buyer tạo đơn hàng cho 1 sản phẩm type="sell"
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.body;
    const buyerId = req.user._id;
 
    // 1. Lấy sản phẩm
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
 
    // 2. Kiểm tra điều kiện
    if (product.type !== 'sell') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Sản phẩm này không hỗ trợ mua bán (dùng luồng donate hoặc exchange)' });
    }
    if (!product.isAvailable || product.status !== 'available') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Sản phẩm không còn khả dụng' });
    }
    if (product.ownerId.toString() === buyerId.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Bạn không thể mua sản phẩm của chính mình' });
    }
 
    // 3. Tạo đơn hàng — phí tự tính trong pre-validate hook của model
    const [order] = await Order.create(
      [
        {
          buyerId,
          sellerId:   product.ownerId,
          productId:  product._id,
          totalPrice: product.price,
        },
      ],
      { session }
    );
 
    // 4. Đặt sản phẩm sang "reserved" để không ai khác mua được
    product.status      = 'reserved';
    product.isAvailable = false;
    await product.save({ session });
 
    await session.commitTransaction();
 
    // 5. Populate để trả về thông tin đầy đủ
    await order.populate([
      { path: 'productId', select: 'title price condition thumbnail' },
      { path: 'sellerId',  select: 'userName email' },
    ]);
 
    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công. Đang chờ seller xác nhận.',
      data: order,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
 
// ── PUT /api/orders/:id/confirm ───────────────────────────────────────────────
// Seller xác nhận sẽ giao hàng
exports.confirmOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
 
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Chỉ seller mới có thể xác nhận đơn hàng này' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Đơn hàng đang ở trạng thái "${order.status}", không thể xác nhận` });
    }
 
    order.status      = 'confirmed';
    order.confirmedAt = new Date();
    await order.save();
 
    return res.json({ success: true, message: 'Đã xác nhận đơn hàng', data: order });
  } catch (err) {
    next(err);
  }
};
 
// ── PUT /api/orders/:id/complete ──────────────────────────────────────────────
// Seller bấm "Đã giao" → hệ thống trừ 10% phí, cộng 90% vào balance seller
exports.completeOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
 
    if (order.sellerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Chỉ seller mới có thể hoàn tất đơn hàng này' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Đơn hàng đang ở trạng thái "${order.status}", không thể hoàn tất` });
    }
    if (order.balanceCredited) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được xử lý tài chính rồi' });
    }
 
    // 1. Cập nhật trạng thái đơn hàng
    order.status          = 'completed';
    order.completedAt     = new Date();
    order.balanceCredited = true;
    await order.save({ session });
 
    // 2. Cập nhật sản phẩm → "sold"
    await Product.findByIdAndUpdate(
      order.productId,
      { status: 'sold', isAvailable: false },
      { session }
    );
 
    // 3. Cộng 90% vào balance của seller (đây là bước trừ 10% phí nền tảng)
    await User.findByIdAndUpdate(
      order.sellerId,
      { $inc: { balance: order.sellerReceives } },
      { session }
    );
 
    await session.commitTransaction();
 
    return res.json({
      success: true,
      message: `Giao dịch hoàn tất. Seller nhận ${order.sellerReceives.toLocaleString('vi-VN')}đ (sau khi trừ phí ${order.platformFee.toLocaleString('vi-VN')}đ)`,
      data: {
        orderId:        order._id,
        totalPrice:     order.totalPrice,
        platformFee:    order.platformFee,
        sellerReceives: order.sellerReceives,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
 
// ── PUT /api/orders/:id/cancel ────────────────────────────────────────────────
// Buyer hoặc seller hủy đơn (chỉ khi chưa completed)
exports.cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
 
    const userId = req.user._id.toString();
    const isBuyer  = order.buyerId.toString()  === userId;
    const isSeller = order.sellerId.toString() === userId;
 
    if (!isBuyer && !isSeller) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' });
    }
    if (order.status === 'completed') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng đã hoàn tất' });
    }
    if (order.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy rồi' });
    }
 
    order.status       = 'cancelled';
    order.cancelReason = req.body.reason || '';
    order.cancelledAt  = new Date();
    await order.save({ session });
 
    // Trả sản phẩm về "available"
    await Product.findByIdAndUpdate(
      order.productId,
      { status: 'available', isAvailable: true },
      { session }
    );
 
    await session.commitTransaction();
 
    return res.json({ success: true, message: 'Đã hủy đơn hàng. Sản phẩm được mở lại.', data: order });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
 
// ── GET /api/orders/my-purchases ─────────────────────────────────────────────
// Buyer xem đơn hàng đã mua
exports.getMyPurchases = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('productId', 'title price thumbnail condition')
      .populate('sellerId',  'userName');
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};
 
// ── GET /api/orders/my-sales ──────────────────────────────────────────────────
// Seller xem đơn hàng nhận được
exports.getMySales = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('productId', 'title price thumbnail condition')
      .populate('buyerId',   'userName');
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};
 
// ── GET /api/orders/:id ───────────────────────────────────────────────────────
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId', 'title price thumbnail condition location')
      .populate('buyerId',   'userName email')
      .populate('sellerId',  'userName email');
 
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
 
    const userId = req.user._id.toString();
    if (order.buyerId._id.toString() !== userId && order.sellerId._id.toString() !== userId && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
    }
 
    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};