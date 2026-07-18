const mongoose = require('mongoose');
const Cart    = require('../models/modelCart');
const Product = require('../models/modelProduct');
const Order   = require('../models/modelOrder');
const User    = require('../models/modelUser');
 
const getPopulatedCart = (userId) =>
  Cart.findOne({ userId }).populate({
    path: 'items.productId',
    select: 'title price condition thumbnail ownerId status isAvailable type',
    populate: { path: 'ownerId', select: 'userName' },
  });
 

exports.getCart = async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    if (!cart) return res.json({ success: true, data: { items: [], summary: buildSummary([]) } });
 
   
    const validItems = cart.items.filter((item) => {
      const p = item.productId;
      return p && p.isAvailable && p.status === 'available' && p.type === 'sell';
    });
 
    return res.json({
      success: true,
      data: {
        items:   validItems,
        summary: buildSummary(validItems),
      },
    });
  } catch (err) {
    next(err);
  }
};
 

exports.addToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user._id;
 
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    if (product.type !== 'sell')
      return res.status(400).json({ success: false, message: 'Chỉ sản phẩm bán mới được thêm vào giỏ hàng' });
    if (!product.isAvailable || product.status !== 'available')
      return res.status(400).json({ success: false, message: 'Sản phẩm này không còn khả dụng' });
    if (product.ownerId.toString() === buyerId.toString())
      return res.status(400).json({ success: false, message: 'Bạn không thể thêm sản phẩm của chính mình vào giỏ' });
 
    const cart = await Cart.findOneAndUpdate(
      { userId: buyerId, 'items.productId': { $ne: productId } }, 
      {
        $setOnInsert: { userId: buyerId },
        $push: { items: { productId, addedAt: new Date() } },
      },
      { upsert: true, new: true }
    );
 
    const alreadyExists = await Cart.findOne({ userId: buyerId, 'items.productId': productId });
    if (!cart && alreadyExists)
      return res.status(400).json({ success: false, message: 'Sản phẩm đã có trong giỏ hàng' });
 
    const populated = await getPopulatedCart(buyerId);
    const validItems = populated.items.filter(
      (i) => i.productId && i.productId.isAvailable && i.productId.status === 'available'
    );
 
    return res.status(201).json({
      success: true,
      message: `Đã thêm "${product.title}" vào giỏ hàng`,
      data: { items: validItems, summary: buildSummary(validItems) },
    });
  } catch (err) {
    next(err);
  }
};
 
exports.removeFromCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { items: { productId: req.params.productId } } }
    );
    const populated = await getPopulatedCart(req.user._id);
    const validItems = populated
      ? populated.items.filter((i) => i.productId && i.productId.isAvailable)
      : [];
 
    return res.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: { items: validItems, summary: buildSummary(validItems) },
    });
  } catch (err) {
    next(err);
  }
};
 
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { $set: { items: [] } });
    return res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng', data: { items: [], summary: buildSummary([]) } });
  } catch (err) {
    next(err);
  }
};
 

exports.checkout = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const buyerId = req.user._id;
 

    const buyer = await User.findById(buyerId).select('userName email phone address district city').session(session);
    if (!buyer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }
 
    const missingFields = [];
    if (!buyer.phone)    missingFields.push('số điện thoại');
    if (!buyer.address)  missingFields.push('địa chỉ');
    if (!buyer.city)     missingFields.push('tỉnh/thành phố');
    if (missingFields.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Vui lòng cập nhật ${missingFields.join(', ')} trong hồ sơ trước khi đặt hàng`,
        missingFields,
      });
    }
 
    const cart = await Cart.findOne({ userId: buyerId }).session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }
 
    const { selectedProductIds } = req.body;
    const itemsToCheckout = selectedProductIds?.length
      ? cart.items.filter((i) => selectedProductIds.includes(i.productId.toString()))
      : cart.items;
 
    if (itemsToCheckout.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Không có sản phẩm nào được chọn' });
    }
 
    const productIds = itemsToCheckout.map((i) => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } }).session(session);
 
    const errors   = [];
    const toCreate = [];
 
    for (const item of itemsToCheckout) {
      const product = products.find((p) => p._id.toString() === item.productId.toString());
      if (!product) { errors.push(`Sản phẩm không tồn tại`); continue; }
      if (product.type !== 'sell') { errors.push(`"${product.title}" không phải sản phẩm bán`); continue; }
      if (!product.isAvailable || product.status !== 'available') {
        errors.push(`"${product.title}" đã được bán hoặc không còn khả dụng`);
        continue;
      }
      if (product.ownerId.toString() === buyerId.toString()) {
        errors.push(`"${product.title}" là sản phẩm của chính bạn`);
        continue;
      }
      toCreate.push(product);
    }
 
    if (errors.length > 0 && toCreate.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: errors.join('; ') });
    }
 
    const PLATFORM_FEE_RATE = 0.1;
    const createdOrders = [];
 
    for (const product of toCreate) {
      const platformFee    = Math.round(product.price * PLATFORM_FEE_RATE);
      const sellerReceives = product.price - platformFee;
 
      const [order] = await Order.create(
        [
          {
            buyerId,
            sellerId: product.ownerId,
            productId: product._id,
            totalPrice: product.price,
            platformFeeRate: PLATFORM_FEE_RATE,
            platformFee,
            sellerReceives,
            shippingInfo: {
              name:     buyer.userName,
              email:    buyer.email,
              phone:    buyer.phone,
              address:  buyer.address,
              district: buyer.district,
              city:     buyer.city,
            },
          },
        ],
        { session }
      );
 
      product.status      = 'reserved';
      product.isAvailable = false;
      await product.save({ session });
 
      createdOrders.push(order);
    }
 
    const checkedOutIds = toCreate.map((p) => p._id);
    await Cart.findOneAndUpdate(
      { userId: buyerId },
      { $pull: { items: { productId: { $in: checkedOutIds } } } },
      { session }
    );
 
    await session.commitTransaction();
 
    return res.status(201).json({
      success: true,
      message: `Đặt hàng thành công ${createdOrders.length} sản phẩm${errors.length ? `. Lưu ý: ${errors.join('; ')}` : ''}`,
      data: {
        orders:        createdOrders,
        ordersCount:   createdOrders.length,
        skippedErrors: errors,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
 
function buildSummary(items) {
  const totalPrice    = items.reduce((sum, i) => sum + (i.productId?.price ?? 0), 0);
  const platformFee   = Math.round(totalPrice * 0.1);
  return {
    itemCount:      items.length,
    totalPrice,
    platformFee,
    sellerReceives: totalPrice - platformFee, 
  };
}