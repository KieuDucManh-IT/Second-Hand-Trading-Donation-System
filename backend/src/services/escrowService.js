
const mongoose = require("mongoose");
const crypto   = require("crypto");
 
const Order           = require("../models/modelOrder");
const Wallet          = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const Product         = require("../models/modelProduct");
 
const PLATFORM_FEE_RATE     = Number(process.env.PLATFORM_FEE_RATE || 0.1);
const BUYER_CONFIRM_DAYS    = Number(process.env.BUYER_CONFIRM_DAYS || 7);
 
// ─── Helpers ─────────────────────────────────────────────────────────────────
 
function getId(v) {
  return String(v?._id ?? v);
}
 
function sameId(a, b) {
  return getId(a) === getId(b);
}
 
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
 
function makeWalletAddress(userId) {
  return `SL${String(userId).slice(-10).toUpperCase()}`;
}
 
function makeCode(prefix) {
  return `${prefix}${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
 
async function ensureWallet(userId, session) {
  let wallet = await Wallet.findOne({ user: userId }).session(session ?? null);
  if (!wallet) {
    const [created] = await Wallet.create(
      [{ user: userId, address: makeWalletAddress(userId), balance: 0, lockedBalance: 0 }],
      session ? { session } : undefined
    );
    wallet = created;
  }
  return wallet;
}
 
async function createTx({ wallet, user, type, amount, order, note, metadata = {}, session }) {
  const prefixMap = {
    purchase_payment: "PAY",
    escrow_hold:      "ESC",
    escrow_release:   "REL",
    refund:           "REF",
  };
  const [tx] = await WalletTransaction.create(
    [{
      wallet,
      user,
      type,
      status: "completed",
      amount,
      code: makeCode(prefixMap[type] ?? "TX"),
      order,
      note,
      metadata,
      completedAt: new Date(),
    }],
    session ? { session } : undefined
  );
  return tx;
}
 
// ─── 1. Buyer thanh toán bằng ví ─────────────────────────────────────────────
 
async function payOrderByWallet(orderId, buyerId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
 
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (!sameId(order.buyerId, buyerId)) throw new Error("Bạn không phải người mua của đơn này");
    if (order.orderStatus !== "pending_seller_confirm")
      throw new Error("Đơn hàng không ở trạng thái chờ xác nhận");
    if (order.paymentStatus === "paid") throw new Error("Đơn hàng đã được thanh toán");
    if (order.paymentMethod !== "wallet") throw new Error("Đơn hàng không dùng phương thức ví");
 
    const buyerWallet = await ensureWallet(buyerId, session);
    const available   = buyerWallet.balance - buyerWallet.lockedBalance;
 
    if (available < order.totalPrice) {
      throw new Error(
        `Số dư ví không đủ. Cần ${order.totalPrice.toLocaleString("vi-VN")}đ, ` +
        `hiện có ${available.toLocaleString("vi-VN")}đ. Vui lòng nạp thêm.`
      );
    }
 
    // Trừ tiền buyer + khoá vào lockedBalance của chính buyer wallet
    // (tiền nằm trong hệ thống, không chuyển cho seller cho đến khi hoàn tất)
    buyerWallet.balance        -= order.totalPrice;
    buyerWallet.lockedBalance  += 0; // tiền đã bị trừ, ko cần lock thêm
    await buyerWallet.save({ session });
 
    // Cập nhật đơn hàng
    order.paymentStatus = "paid";
    order.escrowStatus  = "holding";
    order.escrowAmount  = order.totalPrice;
    order.paidAt        = new Date();
    await order.save({ session });
 
    // Ghi giao dịch
    await createTx({
      wallet: buyerWallet._id, user: buyerId,
      type: "purchase_payment", amount: order.totalPrice,
      order: order._id, note: "Thanh toán đơn hàng qua ví – tiền đang được hệ thống giữ",
      session,
    });
 
    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
 
// ─── 2. Seller xác nhận đơn ──────────────────────────────────────────────────
 
async function sellerConfirmOrder(orderId, sellerId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.sellerId, sellerId)) throw new Error("Chỉ seller mới có thể xác nhận đơn này");
  if (order.orderStatus !== "pending_seller_confirm")
    throw new Error(`Đơn hàng đang ở trạng thái "${order.orderStatus}", không thể xác nhận`);
 
  // Với COD: seller xác nhận là đủ, không cần payment check
  // Với wallet: phải đã paid
  if (order.paymentMethod === "wallet" && order.paymentStatus !== "paid") {
    throw new Error("Buyer chưa thanh toán, không thể xác nhận đơn hàng");
  }
 
  order.orderStatus       = "confirmed";
  order.sellerConfirmedAt = new Date();
  await order.save();
  return order;
}
 
// ─── 3. Seller đánh dấu đang giao ────────────────────────────────────────────
 
async function markOrderShipping(orderId, sellerId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.sellerId, sellerId)) throw new Error("Chỉ seller mới có thể cập nhật đơn này");
  if (order.orderStatus !== "confirmed")
    throw new Error(`Đơn hàng phải ở trạng thái "confirmed" trước khi giao`);
 
  order.orderStatus = "shipping";
  order.shippedAt   = new Date();
  await order.save();
  return order;
}
 
// ─── 4. Seller đánh dấu đã giao → bắt đầu đếm 7 ngày ───────────────────────
 
async function markOrderDelivered(orderId, sellerId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.sellerId, sellerId)) throw new Error("Chỉ seller mới có thể cập nhật đơn này");
  if (!["confirmed", "shipping"].includes(order.orderStatus))
    throw new Error(`Đơn hàng phải ở trạng thái "confirmed" hoặc "shipping"`);
 
  order.orderStatus    = "delivered";
  order.deliveredAt    = new Date();
  order.confirmDeadline = addDays(new Date(), BUYER_CONFIRM_DAYS);
  await order.save();
  return order;
}
 
// ─── 5. Buyer xác nhận đã nhận → release tiền cho seller ────────────────────
 
async function buyerConfirmReceived(orderId, buyerId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
 
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (!sameId(order.buyerId, buyerId)) throw new Error("Chỉ buyer mới có thể xác nhận nhận hàng");
    if (!["delivered", "shipping", "confirmed"].includes(order.orderStatus))
      throw new Error("Đơn hàng chưa ở trạng thái có thể xác nhận nhận hàng");
    if (order.escrowStatus !== "holding") throw new Error("Tiền escrow không ở trạng thái đang giữ");
 
    await _releaseEscrowToSeller(order, "buyer_confirmed", session);
 
    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
 
// ─── 6. Cron job: tự động release sau 7 ngày ─────────────────────────────────
 
async function autoReleaseExpiredOrders() {
  const now = new Date();
  const expired = await Order.find({
    orderStatus:    "delivered",
    escrowStatus:   "holding",
    paymentStatus:  "paid",
    confirmDeadline: { $lte: now },
  }).select("_id");
 
  let success = 0, failed = 0;
 
  for (const { _id } of expired) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const order = await Order.findById(_id).session(session);
      if (!order || order.escrowStatus !== "holding") {
        await session.abortTransaction();
        continue;
      }
      await _releaseEscrowToSeller(order, "auto_after_7_days", session);
      await session.commitTransaction();
      success++;
    } catch (err) {
      await session.abortTransaction();
      console.error("AUTO RELEASE ORDER ERROR:", _id, err.message);
      failed++;
    } finally {
      session.endSession();
    }
  }
 
  return { total: expired.length, success, failed };
}
 
// ─── Helper: chuyển tiền escrow → ví seller ──────────────────────────────────
 
async function _releaseEscrowToSeller(order, reason, session) {
  const sellerWallet = await ensureWallet(order.sellerId, session);
 
  sellerWallet.balance += order.sellerReceives;
  await sellerWallet.save({ session });
 
  order.orderStatus  = "completed";
  order.escrowStatus = "released";
  order.paymentStatus = "released";
  order.releasedAt   = new Date();
  order.releaseReason = reason;
  await order.save({ session });
 
  await Product.findByIdAndUpdate(
    order.productId,
    { status: "sold", isAvailable: false },
    { session }
  );
 
  // Ghi giao dịch cho seller
  await createTx({
    wallet: sellerWallet._id, user: order.sellerId,
    type: "escrow_release", amount: order.sellerReceives,
    order: order._id,
    note: `Nhận tiền từ đơn hàng (sau phí ${Math.round(order.platformFeeRate * 100)}%)`,
    metadata: {
      totalPrice:     order.totalPrice,
      platformFee:    order.platformFee,
      sellerReceives: order.sellerReceives,
      reason,
    },
    session,
  });
}
 
// ─── 7. Huỷ đơn + hoàn tiền buyer ───────────────────────────────────────────
 
async function cancelOrderAndRefund(orderId, userId, reason = "") {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
 
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
 
    const isBuyer  = sameId(order.buyerId, userId);
    const isSeller = sameId(order.sellerId, userId);
    if (!isBuyer && !isSeller) throw new Error("Bạn không có quyền huỷ đơn hàng này");
 
    const cancellableStatuses = ["pending_seller_confirm", "confirmed"];
    if (!cancellableStatuses.includes(order.orderStatus))
      throw new Error(`Không thể huỷ đơn ở trạng thái "${order.orderStatus}"`);
 
    // Hoàn tiền nếu buyer đã thanh toán qua ví
    if (order.paymentMethod === "wallet" && order.paymentStatus === "paid" && order.escrowAmount > 0) {
      const buyerWallet = await ensureWallet(order.buyerId, session);
      buyerWallet.balance += order.escrowAmount;
      await buyerWallet.save({ session });
 
      order.paymentStatus = "refunded";
      order.escrowStatus  = "refunded";
      order.refundedAt    = new Date();
 
      await createTx({
        wallet: buyerWallet._id, user: order.buyerId,
        type: "refund", amount: order.escrowAmount,
        order: order._id, note: "Hoàn tiền do huỷ đơn hàng",
        session,
      });
    }
 
    order.orderStatus  = "cancelled";
    order.cancelReason = reason;
    order.cancelledAt  = new Date();
    await order.save({ session });
 
    // Mở lại sản phẩm
    await Product.findByIdAndUpdate(
      order.productId,
      { status: "available", isAvailable: true },
      { session }
    );
 
    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
 
// ─── 8. Mở khiếu nại ─────────────────────────────────────────────────────────
 
async function openOrderDispute(orderId, userId, reason = "") {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
 
  const isBuyer = sameId(order.buyerId, userId);
  if (!isBuyer) throw new Error("Chỉ buyer mới có thể mở khiếu nại");
  if (!["delivered", "shipping"].includes(order.orderStatus))
    throw new Error("Chỉ có thể khiếu nại khi đơn đang giao hoặc đã giao");
  if (order.orderStatus === "disputed") throw new Error("Đơn hàng đã có khiếu nại");
 
  order.orderStatus  = "disputed";
  order.escrowStatus = "disputed";
  order.cancelReason = reason || "Buyer mở khiếu nại";
  await order.save();
  return order;
}
 
module.exports = {
  payOrderByWallet,
  sellerConfirmOrder,
  markOrderShipping,
  markOrderDelivered,
  buyerConfirmReceived,
  autoReleaseExpiredOrders,
  cancelOrderAndRefund,
  openOrderDispute,
};