const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/modelOrder");
const Wallet = require("../models/modelWallet");
const WalletTransaction = require("../models/modelWalletTransaction");
const Product = require("../models/modelProduct");

function getId(value) {
  return String(value?._id || value);
}

function sameId(a, b) {
  return getId(a) === getId(b);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function makeWalletAddress(userId) {
  return `SL${String(userId).slice(-10).toUpperCase()}`;
}

function makeTransactionCode(prefix) {
  return `${prefix}${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function ensureWallet(userId, session) {
  let wallet = await Wallet.findOne({ user: userId }).session(session || null);

  if (!wallet) {
    const created = await Wallet.create(
      [
        {
          user: userId,
          address: makeWalletAddress(userId),
          balance: 0,
          lockedBalance: 0,
          currency: "VND",
          status: "active",
        },
      ],
      session ? { session } : undefined
    );

    wallet = created[0];
  }

  return wallet;
}

async function createWalletTransaction({
  wallet,
  user,
  type,
  amount,
  order,
  note,
  metadata = {},
  session,
}) {
  const prefixMap = {
    purchase_payment: "PUP",
    escrow_hold: "ESH",
    escrow_release: "ESR",
    refund: "REF",
  };

  const created = await WalletTransaction.create(
    [
      {
        wallet,
        user,
        type,
        status: "completed",
        amount,
        code: makeTransactionCode(prefixMap[type] || "TX"),
        order,
        note,
        metadata,
      },
    ],
    session ? { session } : undefined
  );

  return created[0];
}

/**
 * Thanh toán tiền đơn hàng từ ví của Buyer. Tiền sẽ được giữ ở escrow.
 */
async function payOrderByWallet(orderId, userId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (order.status !== "pending") {
      throw new Error("Đơn hàng này không còn ở trạng thái chờ thanh toán");
    }

    if (!sameId(order.buyerId, userId)) {
      throw new Error("Bạn không có quyền thanh toán đơn hàng này");
    }

    const price = Number(order.totalPrice || 0);

    const wallet = await ensureWallet(userId, session);
    const availableBalance = Number(wallet.balance || 0) - Number(wallet.lockedBalance || 0);

    if (availableBalance < price) {
      throw new Error(`Số dư ví không đủ. Cần ${price.toLocaleString("vi-VN")}đ, vui lòng nạp thêm.`);
    }

    // Khấu trừ tiền của Buyer
    wallet.balance -= price;
    await wallet.save({ session });

    order.status = "paid";
    await order.save({ session });

    // Cập nhật trạng thái sản phẩm sang reserved
    await Product.findByIdAndUpdate(
      order.productId,
      { status: "reserved", isAvailable: false },
      { session }
    );

    // Ghi nhận transaction
    await createWalletTransaction({
      wallet: wallet._id,
      user: userId,
      type: "purchase_payment",
      amount: price,
      order: order._id,
      note: `Thanh toán mua hàng đơn hàng #${order._id}`,
      metadata: {
        direction: "debit",
      },
      session,
    });

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Seller xác nhận đơn hàng
 */
async function sellerConfirmOrder(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  if (!sameId(order.sellerId, userId)) {
    throw new Error("Bạn không phải người bán đơn hàng này");
  }

  if (order.status !== "paid" && order.status !== "pending") {
    throw new Error("Đơn hàng phải ở trạng thái đã thanh toán hoặc chờ để xác nhận");
  }

  order.status = "confirmed";
  order.confirmedAt = new Date();
  await order.save();

  return order;
}

/**
 * Hủy đơn hàng và hoàn tiền (nếu đã thanh toán)
 */
async function cancelOrderAndRefund(orderId, userId, reason = "") {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (["completed", "cancelled", "disputed"].includes(order.status)) {
      throw new Error("Không thể hủy đơn hàng ở trạng thái này");
    }

    const isBuyer = sameId(order.buyerId, userId);
    const isSeller = sameId(order.sellerId, userId);

    if (!isBuyer && !isSeller) {
      throw new Error("Bạn không có quyền hủy đơn hàng này");
    }

    // Nếu hủy khi đã thanh toán (paid, confirmed, shipping, delivered) -> hoàn tiền cho Buyer
    const isPaid = ["paid", "confirmed", "shipping", "delivered"].includes(order.status);
    if (isPaid) {
      const price = Number(order.totalPrice || 0);
      const buyerWallet = await ensureWallet(order.buyerId, session);

      buyerWallet.balance += price;
      await buyerWallet.save({ session });

      await createWalletTransaction({
        wallet: buyerWallet._id,
        user: order.buyerId,
        type: "refund",
        amount: price,
        order: order._id,
        note: `Hoàn tiền hủy đơn hàng #${order._id}`,
        metadata: {
          direction: "credit",
          reason,
        },
        session,
      });
    }

    order.status = "cancelled";
    order.cancelReason = reason || "Đã hủy đơn hàng";
    order.cancelledAt = new Date();
    await order.save({ session });

    // Khôi phục trạng thái sản phẩm
    await Product.findByIdAndUpdate(
      order.productId,
      { status: "available", isAvailable: true },
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Seller đánh dấu đang vận chuyển
 */
async function markOrderShipping(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  if (!sameId(order.sellerId, userId)) {
    throw new Error("Bạn không phải người bán đơn hàng này");
  }

  if (order.status !== "confirmed" && order.status !== "paid") {
    throw new Error("Đơn hàng chưa được xác nhận để giao");
  }

  order.status = "shipping";
  await order.save();

  return order;
}

/**
 * Seller đánh dấu đã giao hàng (bắt đầu đếm ngược 7 ngày)
 */
async function markOrderDelivered(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  if (!sameId(order.sellerId, userId)) {
    throw new Error("Bạn không phải người bán đơn hàng này");
  }

  if (order.status !== "shipping") {
    throw new Error("Đơn hàng chưa ở trạng thái đang giao");
  }

  order.status = "delivered";
  order.autoReleaseAt = addDays(new Date(), 7); // 7 ngày tự động release tiền
  await order.save();

  return order;
}

/**
 * Buyer xác nhận đã nhận hàng (giải ngân tiền cho Seller)
 */
async function buyerConfirmReceived(orderId, userId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (!sameId(order.buyerId, userId)) {
      throw new Error("Bạn không phải người mua đơn hàng này");
    }

    if (!["shipping", "delivered"].includes(order.status)) {
      throw new Error("Đơn hàng chưa được gửi đi để bạn xác nhận");
    }

    if (order.balanceCredited) {
      throw new Error("Đơn hàng này đã được thanh toán cho người bán trước đó");
    }

    const sellerReceives = Number(order.sellerReceives || 0);

    // Giải ngân tiền cho Seller
    const sellerWallet = await ensureWallet(order.sellerId, session);
    sellerWallet.balance += sellerReceives;
    await sellerWallet.save({ session });

    order.status = "completed";
    order.completedAt = new Date();
    order.balanceCredited = true;
    await order.save({ session });

    // Đánh dấu sản phẩm đã bán
    await Product.findByIdAndUpdate(
      order.productId,
      { status: "sold", isAvailable: false },
      { session }
    );

    // Ghi nhận giao dịch giải ngân
    await createWalletTransaction({
      wallet: sellerWallet._id,
      user: order.sellerId,
      type: "escrow_release",
      amount: sellerReceives,
      order: order._id,
      note: `Nhận tiền bán hàng đơn hàng #${order._id} (trừ 10% phí)`,
      metadata: {
        direction: "credit",
        platformFee: order.platformFee,
      },
      session,
    });

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Buyer mở khiếu nại (tạm dừng auto release)
 */
async function openOrderDispute(orderId, userId, reason = "") {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  if (!sameId(order.buyerId, userId) && !sameId(order.sellerId, userId)) {
    throw new Error("Bạn không thuộc đơn hàng này");
  }

  if (order.status !== "delivered" && order.status !== "shipping") {
    throw new Error("Chỉ được khiếu nại đơn hàng đang giao hoặc đã giao");
  }

  order.status = "disputed";
  order.disputedAt = new Date();
  order.disputeReason = reason || "Người dùng mở khiếu nại";
  order.disputeBy = userId;
  order.autoReleaseAt = null; // Hủy auto release

  await order.save();
  return order;
}

/**
 * Tự động giải ngân cho Seller nếu quá 7 ngày kể từ khi Delivered mà không có khiếu nại
 */
async function autoReleaseExpiredOrders() {
  const now = new Date();

  const orders = await Order.find({
    status: "delivered",
    balanceCredited: false,
    autoReleaseAt: { $lte: now },
  });

  let success = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      // Đóng giả lập buyer confirm để chuyển tiền cho seller
      await buyerConfirmReceived(order._id, order.buyerId);
      success += 1;
    } catch (error) {
      failed += 1;
      console.error(`AUTO RELEASE ORDER ERROR #${order._id}:`, error.message);
    }
  }

  return {
    total: orders.length,
    success,
    failed,
  };
}

module.exports = {
  payOrderByWallet,
  sellerConfirmOrder,
  cancelOrderAndRefund,
  markOrderShipping,
  markOrderDelivered,
  buyerConfirmReceived,
  openOrderDispute,
  autoReleaseExpiredOrders,
};
