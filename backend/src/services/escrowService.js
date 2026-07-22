const mongoose = require("mongoose");
const crypto = require("crypto");

const Order = require("../models/modelOrder");
const Wallet = require("../models/modelWallet");
const WalletTransaction = require("../models/modelWalletTransaction");
const Product = require("../models/modelProduct");
const { sendNotification } = require("../utils/notificationHelper");

const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.1);
const BUYER_CONFIRM_DAYS = Number(process.env.BUYER_CONFIRM_DAYS || 7);

function getIO() {
  return global.__io || null;
}

function getId(value) {
  return String(value?._id || value || "");
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

function getOrderStatus(order) {
  return order.orderStatus || order.status;
}

function setOrderStatus(order, status) {
  order.orderStatus = status;
  order.status = status;
}

function getPaymentStatus(order) {
  return order.paymentStatus || "";
}

function getEscrowStatus(order) {
  return order.escrowStatus || "";
}

function getOrderAmount(order) {
  return Number(order.totalPrice || order.price || order.amount || 0);
}

function getSellerReceives(order) {
  const totalPrice = getOrderAmount(order);
  if (Number(order.sellerReceives) > 0) return Number(order.sellerReceives);
  const platformFeeRate = Number(order.platformFeeRate || PLATFORM_FEE_RATE);
  const platformFee = Math.round(totalPrice * platformFeeRate);
  return Math.max(totalPrice - platformFee, 0);
}

function getPlatformFee(order) {
  const totalPrice = getOrderAmount(order);
  if (Number(order.platformFee) > 0) return Number(order.platformFee);
  const platformFeeRate = Number(order.platformFeeRate || PLATFORM_FEE_RATE);
  return Math.round(totalPrice * platformFeeRate);
}

function isCOD(order) {
  return order.paymentMethod === "cod";
}

async function ensureWallet(userId, session) {
  let wallet = await Wallet.findOne({ user: userId }).session(session || null);
  if (!wallet) {
    const created = await Wallet.create(
      [{ user: userId, address: makeWalletAddress(userId), balance: 0, lockedBalance: 0, currency: "VND", status: "active" }],
      session ? { session } : undefined
    );
    wallet = created[0];
  }
  return wallet;
}

async function createWalletTransaction({ wallet, user, type, amount, order, note, metadata = {}, session }) {
  const prefixMap = { purchase_payment: "PAY", escrow_hold: "ESC", escrow_release: "REL", refund: "REF" };
  const created = await WalletTransaction.create(
    [{ wallet, user, type, status: "completed", amount, code: makeTransactionCode(prefixMap[type] || "TX"), order, note, metadata, completedAt: new Date() }],
    session ? { session } : undefined
  );
  return created[0];
}


async function payOrderByWallet(orderId, buyerId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (!sameId(order.buyerId, buyerId)) throw new Error("Bạn không phải người mua của đơn này");
    const currentStatus = getOrderStatus(order);
    if (!["pending", "pending_seller_confirm"].includes(currentStatus)) throw new Error("Đơn hàng không ở trạng thái chờ thanh toán");
    if (getPaymentStatus(order) === "paid" || currentStatus === "paid") throw new Error("Đơn hàng đã được thanh toán");
    if (order.paymentMethod !== "wallet") throw new Error("Đơn hàng không dùng phương thức ví");
    const totalPrice = getOrderAmount(order);
    if (!totalPrice || totalPrice <= 0) throw new Error("Giá trị đơn hàng không hợp lệ");
    const buyerWallet = await ensureWallet(buyerId, session);
    const availableBalance = Number(buyerWallet.balance || 0) - Number(buyerWallet.lockedBalance || 0);
    if (availableBalance < totalPrice) {
      throw new Error(`Số dư ví không đủ. Cần ${totalPrice.toLocaleString("vi-VN")}đ, hiện có ${availableBalance.toLocaleString("vi-VN")}đ. Vui lòng nạp thêm.`);
    }
    buyerWallet.balance -= totalPrice;
    await buyerWallet.save({ session });
    order.paymentStatus = "paid";
    order.escrowStatus = "holding";
    order.escrowAmount = totalPrice;
    order.totalPrice = totalPrice;
    order.platformFeeRate = Number(order.platformFeeRate || PLATFORM_FEE_RATE);
    order.platformFee = getPlatformFee(order);
    order.sellerReceives = getSellerReceives(order);
    order.paidAt = new Date();
    setOrderStatus(order, "paid");
    await order.save({ session });
    await Product.findByIdAndUpdate(order.productId, { status: "reserved", isAvailable: false }, { session });
    await createWalletTransaction({
      wallet: buyerWallet._id, user: buyerId, type: "purchase_payment", amount: totalPrice,
      order: order._id, note: "Thanh toán đơn hàng qua ví – tiền đang được hệ thống giữ",
      metadata: { direction: "debit", escrowStatus: "holding" }, session,
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


async function sellerConfirmOrder(orderId, sellerId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.sellerId, sellerId)) throw new Error("Chỉ seller mới có thể xác nhận đơn này");
  const currentStatus = getOrderStatus(order);
  if (!["pending", "paid", "pending_seller_confirm"].includes(currentStatus)) {
    throw new Error(`Đơn hàng đang ở trạng thái "${currentStatus}", không thể xác nhận`);
  }
  if (order.paymentMethod === "wallet" && getPaymentStatus(order) !== "paid" && currentStatus !== "paid") {
    throw new Error("Buyer chưa thanh toán, không thể xác nhận đơn hàng");
  }
  setOrderStatus(order, "confirmed");
  order.sellerConfirmedAt = new Date();
  order.confirmedAt = new Date();
  await order.save();

  
  sendNotification(getIO(), {
    userId: String(order.buyerId),
    type: "order_confirmed",
    title: "Đơn hàng được xác nhận",
    message: `Người bán đã xác nhận đơn hàng của bạn. Vui lòng chờ hàng được giao.`,
    data: { orderId: order._id },
  });

  return order;
}


async function markOrderShipping(orderId, sellerId, shippingProofImages = []) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.sellerId, sellerId)) throw new Error("Chỉ seller mới có thể cập nhật đơn này");
  const currentStatus = getOrderStatus(order);
  if (!["confirmed", "paid"].includes(currentStatus)) throw new Error('Đơn hàng phải ở trạng thái "confirmed" trước khi giao');
  setOrderStatus(order, "shipping");
  order.shippedAt = new Date();
  if (shippingProofImages && shippingProofImages.length > 0) order.shippingProofImages = shippingProofImages;
  await order.save();

  
  sendNotification(getIO(), {
    userId: String(order.buyerId),
    type: "order_shipping",
    title: "Đơn hàng đang được giao",
    message: `Đơn hàng của bạn đang trên đường giao đến bạn.`,
    data: { orderId: order._id },
  });

  return order;
}


async function markOrderDelivered(orderId, sellerId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.sellerId, sellerId)) throw new Error("Chỉ seller mới có thể cập nhật đơn này");
  const currentStatus = getOrderStatus(order);
  if (!["confirmed", "shipping"].includes(currentStatus)) {
    throw new Error('Đơn hàng phải ở trạng thái "confirmed" hoặc "shipping"');
  }

  
  if (isCOD(order)) {
    setOrderStatus(order, "delivered");
    order.deliveredAt = new Date();
    await order.save();

    
    sendNotification(getIO(), {
      userId: String(order.buyerId),
      type: "order_delivered",
      title: "Đơn hàng đã được giao",
      message: `Đơn hàng COD của bạn đã được giao. Vui lòng xác nhận đã nhận hàng.`,
      data: { orderId: order._id },
    });

    return order;
  }

  
  const deadline = addDays(new Date(), BUYER_CONFIRM_DAYS);
  setOrderStatus(order, "delivered");
  order.deliveredAt = new Date();
  order.confirmDeadline = deadline;
  order.autoReleaseAt = deadline;
  await order.save();

  
  sendNotification(getIO(), {
    userId: String(order.buyerId),
    type: "order_delivered",
    title: "Đơn hàng đã được giao",
    message: `Đơn hàng đã được giao thành công. Bạn có ${BUYER_CONFIRM_DAYS} ngày để xác nhận nhận hàng.`,
    data: { orderId: order._id },
  });

  return order;
}


async function buyerConfirmReceived(orderId, buyerId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (!sameId(order.buyerId, buyerId)) throw new Error("Chỉ buyer mới có thể xác nhận nhận hàng");

    const currentStatus = getOrderStatus(order);
    if (!["delivered", "shipping", "confirmed"].includes(currentStatus)) {
      throw new Error("Đơn hàng chưa ở trạng thái có thể xác nhận nhận hàng");
    }
    if (order.balanceCredited || getEscrowStatus(order) === "released") {
      throw new Error("Đơn hàng này đã được xác nhận trước đó");
    }

    
    if (isCOD(order)) {
      setOrderStatus(order, "completed");
      order.completedAt = new Date();
      order.balanceCredited = false; 
      await order.save({ session });

      await Product.findByIdAndUpdate(order.productId, { status: "sold", isAvailable: false }, { session });

      
      sendNotification(getIO(), {
        userId: String(order.buyerId),
        type: "order_completed",
        title: "Đơn hàng hoàn thành",
        message: `Cảm ơn bạn đã mua hàng! Đơn hàng COD đã hoàn thành.`,
        data: { orderId: order._id },
      });
      sendNotification(getIO(), {
        userId: String(order.sellerId),
        type: "order_completed",
        title: "Đơn hàng hoàn thành",
        message: `Người mua đã xác nhận nhận hàng COD. Đơn hàng hoàn thành.`,
        data: { orderId: order._id },
      });

      await session.commitTransaction();
      return order;
    }

    
    if (getEscrowStatus(order) !== "holding") {
      throw new Error("Tiền escrow không ở trạng thái đang giữ");
    }

    await releaseEscrowToSeller(order, "buyer_confirmed", session);

    
    const sellerAmount = getSellerReceives(order);
    sendNotification(getIO(), {
      userId: String(order.sellerId),
      type: "wallet_received",
      title: "Tiền đã vào ví",
      message: `Người mua đã xác nhận nhận hàng. ${sellerAmount.toLocaleString("vi-VN")}₫ đã được chuyển vào ví của bạn.`,
      data: { orderId: order._id, amount: sellerAmount },
    });

    
    sendNotification(getIO(), {
      userId: String(order.buyerId),
      type: "order_completed",
      title: "Đơn hàng hoàn thành",
      message: `Cảm ơn bạn đã mua hàng! Đơn hàng đã hoàn thành.`,
      data: { orderId: order._id },
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


async function releaseEscrowToSeller(order, reason, session) {
  const sellerWallet = await ensureWallet(order.sellerId, session);
  const sellerReceives = getSellerReceives(order);
  const platformFee = getPlatformFee(order);
  sellerWallet.balance += sellerReceives;
  await sellerWallet.save({ session });
  setOrderStatus(order, "completed");
  order.escrowStatus = "released";
  order.paymentStatus = "released";
  order.releasedAt = new Date();
  order.completedAt = new Date();
  order.releaseReason = reason;
  order.balanceCredited = true;
  order.sellerReceives = sellerReceives;
  order.platformFee = platformFee;
  await order.save({ session });
  await Product.findByIdAndUpdate(order.productId, { status: "sold", isAvailable: false }, { session });
  await createWalletTransaction({
    wallet: sellerWallet._id, user: order.sellerId, type: "escrow_release", amount: sellerReceives,
    order: order._id, note: `Nhận tiền từ đơn hàng sau khi trừ phí nền tảng`,
    metadata: { direction: "credit", totalPrice: getOrderAmount(order), platformFee, sellerReceives, reason },
    session,
  });
}


async function autoReleaseExpiredOrders() {
  const now = new Date();
  const expiredOrders = await Order.find({
    paymentMethod: { $ne: "cod" }, 
    $or: [
      { orderStatus: "delivered", escrowStatus: "holding", paymentStatus: "paid", confirmDeadline: { $lte: now } },
      { status: "delivered", balanceCredited: false, autoReleaseAt: { $lte: now } },
    ],
  }).select("_id buyerId sellerId");

  let success = 0;
  let failed = 0;

  for (const order of expiredOrders) {
    try {
      await buyerConfirmReceived(order._id, order.buyerId);
      success += 1;

      
      const fullOrder = await Order.findById(order._id);
      if (fullOrder) {
        const sellerAmt = getSellerReceives(fullOrder);
        sendNotification(getIO(), {
          userId: String(order.sellerId),
          type: "wallet_received",
          title: "Tiền đã vào ví (tự động)",
          message: `${sellerAmt.toLocaleString("vi-VN")}₫ đã tự động chuyển vào ví sau ${BUYER_CONFIRM_DAYS} ngày.`,
          data: { orderId: order._id, amount: sellerAmt },
        });
      }
    } catch (error) {
      failed += 1;
      console.error(`AUTO RELEASE ORDER ERROR #${order._id}:`, error.message);
    }
  }

  return { total: expiredOrders.length, success, failed };
}


async function cancelOrderAndRefund(orderId, userId, reason = "") {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    const isBuyer = sameId(order.buyerId, userId);
    const isSeller = sameId(order.sellerId, userId);
    if (!isBuyer && !isSeller) throw new Error("Bạn không có quyền hủy đơn hàng này");
    const currentStatus = getOrderStatus(order);
    if (["completed", "cancelled", "disputed"].includes(currentStatus)) {
      throw new Error(`Không thể hủy đơn ở trạng thái "${currentStatus}"`);
    }
    if (!["pending", "pending_seller_confirm", "paid", "confirmed"].includes(currentStatus)) {
      throw new Error(`Không thể hủy đơn ở trạng thái "${currentStatus}"`);
    }

    const alreadyPaid = order.paymentStatus === "paid" || ["paid", "confirmed", "shipping", "delivered"].includes(currentStatus);
    const refundAmount = Number(order.escrowAmount || getOrderAmount(order) || 0);

    
    if (!isCOD(order) && alreadyPaid && refundAmount > 0) {
      const buyerWallet = await ensureWallet(order.buyerId, session);
      buyerWallet.balance += refundAmount;
      await buyerWallet.save({ session });
      order.paymentStatus = "refunded";
      order.escrowStatus = "refunded";
      order.refundedAt = new Date();
      await createWalletTransaction({
        wallet: buyerWallet._id, user: order.buyerId, type: "refund", amount: refundAmount,
        order: order._id, note: "Hoàn tiền do hủy đơn hàng",
        metadata: { direction: "credit", reason }, session,
      });

      
      sendNotification(getIO(), {
        userId: String(order.buyerId),
        type: "wallet_refunded",
        title: "Hoàn tiền thành công",
        message: `Đơn hàng đã bị huỷ. ${refundAmount.toLocaleString("vi-VN")}₫ đã được hoàn về ví của bạn.`,
        data: { orderId: order._id, amount: refundAmount },
      });
    }

    setOrderStatus(order, "cancelled");
    order.cancelReason = reason || "Đã hủy đơn hàng";
    order.cancelledAt = new Date();
    await order.save({ session });

    await Product.findByIdAndUpdate(order.productId, { status: "available", isAvailable: true }, { session });

    
    const notifyUserId = isBuyer ? String(order.sellerId) : String(order.buyerId);
    sendNotification(getIO(), {
      userId: notifyUserId,
      type: "order_cancelled",
      title: "Đơn hàng bị huỷ",
      message: `${isBuyer ? "Người mua" : "Người bán"} đã huỷ đơn hàng.${reason ? ` Lý do: ${reason}` : ""}`,
      data: { orderId: order._id },
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


async function openOrderDispute(orderId, userId, reason = "", evidences = []) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (isCOD(order)) throw new Error("Đơn hàng COD không hỗ trợ khiếu nại qua hệ thống escrow");
  const isBuyer = sameId(order.buyerId, userId);
  const isSeller = sameId(order.sellerId, userId);
  if (!isBuyer && !isSeller) throw new Error("Bạn không thuộc đơn hàng này");
  const currentStatus = getOrderStatus(order);
  if (!["delivered", "shipping"].includes(currentStatus)) throw new Error("Chỉ được khiếu nại đơn hàng đang giao hoặc đã giao");
  setOrderStatus(order, "disputed");
  order.escrowStatus = "disputed";
  order.disputedAt = new Date();
  order.disputeReason = reason || "Người dùng mở khiếu nại";
  order.disputeBy = userId;
  order.cancelReason = reason || "Người dùng mở khiếu nại";
  order.autoReleaseAt = null;
  order.confirmDeadline = null;
  order.complaint = {
    reason: reason || "Người dùng mở khiếu nại",
    evidences: evidences || [],
    status: "pending",
    createdAt: new Date()
  };

  await order.save();

  
  sendNotification(getIO(), {
    userId: String(order.sellerId),
    type: "order_disputed",
    title: "Đơn hàng bị khiếu nại",
    message: `Người mua đã mở khiếu nại cho đơn hàng. Hệ thống tạm dừng chuyển tiền để xem xét.`,
    data: { orderId: order._id },
  });

  return order;
}


async function resolveOrderDispute(orderId, resolution, note = "") {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (order.escrowStatus !== "disputed") {
      throw new Error("Đơn hàng không ở trạng thái tranh chấp");
    }

    if (resolution === "accept") {
      
      const refundAmount = Number(order.escrowAmount || getOrderAmount(order) || 0);
      if (refundAmount > 0) {
        const buyerWallet = await ensureWallet(order.buyerId, session);
        buyerWallet.balance += refundAmount;
        await buyerWallet.save({ session });

        await createWalletTransaction({
          wallet: buyerWallet._id,
          user: order.buyerId,
          type: "refund",
          amount: refundAmount,
          order: order._id,
          note: `Hoàn tiền tranh chấp đơn hàng: ${note}`,
          metadata: {
            direction: "credit",
            reason: note,
          },
          session,
        });
      }

      setOrderStatus(order, "cancelled");
      order.paymentStatus = "refunded";
      order.escrowStatus = "refunded";
      order.refundedAt = new Date();
      order.cancelledAt = new Date();
      order.cancelReason = note || "Manager chấp thuận khiếu nại";

      if (order.complaint) {
        order.complaint.status = "resolved";
        order.complaint.resolvedAt = new Date();
        order.complaint.resolutionNote = note;
      }

      await order.save({ session });

      
      await Product.findByIdAndUpdate(
        order.productId,
        { status: "available", isAvailable: true },
        { session }
      );

    } else if (resolution === "reject") {
      
      await releaseEscrowToSeller(order, `dispute_rejected: ${note}`, session);

      if (order.complaint) {
        order.complaint.status = "rejected";
        order.complaint.resolvedAt = new Date();
        order.complaint.resolutionNote = note;
      }
      await order.save({ session });
    } else {
      throw new Error("Loại giải quyết tranh chấp không hợp lệ");
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}



async function autoCancelExpiredPendingOrders() {
  const now = new Date();
  const expired = await Order.find({
    $or: [{ status: "pending" }, { orderStatus: "pending" }, { orderStatus: "pending_seller_confirm" }],
    paymentStatus: { $ne: "paid" },
    paymentMethod: "wallet",
    paymentDeadline: { $lt: now },
  });
  let cancelled = 0;
  for (const order of expired) {
    try {
      setOrderStatus(order, "cancelled");
      order.cancelReason = "Hết hạn thanh toán (24h)";
      order.cancelledAt = now;
      await order.save();
      await Product.findByIdAndUpdate(order.productId, { status: "available", isAvailable: true });
      cancelled++;
    } catch (e) {
      console.error("[autoCancelExpiredPending] error:", e.message);
    }
  }
  return { cancelled, total: expired.length };
}

async function rateSeller(orderId, buyerId, rating, comment) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!sameId(order.buyerId, buyerId)) throw new Error("Bạn không phải người mua đơn này");
  const currentStatus = getOrderStatus(order);
  if (currentStatus !== "completed") throw new Error("Chỉ có thể đánh giá sau khi đơn hàng hoàn thành");
  if (order.sellerRating && order.sellerRating.rating) throw new Error("Bạn đã đánh giá đơn hàng này rồi");
  if (!rating || rating < 1 || rating > 5) throw new Error("Điểm đánh giá phải từ 1 đến 5");
  order.sellerRating = { rating, comment: comment || "", ratedAt: new Date() };
  await order.save();
  const User = require("../models/modelUser");
  const ratedOrders = await Order.find({ sellerId: order.sellerId, "sellerRating.rating": { $exists: true, $gt: 0 } });
  if (ratedOrders.length > 0) {
    const avg = ratedOrders.reduce((sum, o) => sum + (o.sellerRating?.rating || 0), 0) / ratedOrders.length;
    await User.findByIdAndUpdate(order.sellerId, { rating: Math.round(avg * 10) / 10 });
  } else {
    await User.findByIdAndUpdate(order.sellerId, { rating: 5 });
  }
  return order;
}
 
async function getSellerReviews(sellerId, { page = 1, limit = 20 } = {}) {
  const filter = { sellerId, "sellerRating.rating": { $exists: true, $gt: 0 } };
  const pageNum = Math.max(Number(page) || 1, 1);
  const lim = Math.max(Number(limit) || 20, 1);
  const skip = (pageNum - 1) * lim;

  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .sort({ "sellerRating.ratedAt": -1, createdAt: -1 })
    .skip(skip)
    .limit(lim)
    .populate("buyerId", "fullName userName avatar")
    .populate("productId", "title thumbnail")
    .select("buyerId productId sellerRating createdAt");

  const reviews = orders.map((o) => ({
    orderId: o._id,
    rating: o.sellerRating.rating,
    comment: o.sellerRating.comment,
    ratedAt: o.sellerRating.ratedAt,
    buyer: o.buyerId
      ? {
          id: o.buyerId._id,
          fullName: o.buyerId.fullName,
          userName: o.buyerId.userName,
          avatar: o.buyerId.avatar,
        }
      : null,
    product: o.productId
      ? { id: o.productId._id, title: o.productId.title, thumbnail: o.productId.thumbnail }
      : null,
  }));

  const allRatedOrders = await Order.find(filter).select("sellerRating.rating");
  const totalReviews = allRatedOrders.length;
  const averageRating = totalReviews > 0
    ? Math.round((allRatedOrders.reduce((sum, o) => sum + (o.sellerRating?.rating || 0), 0) / totalReviews) * 10) / 10
    : 0;

  return {
    reviews,
    averageRating,
    totalReviews,
    pagination: {
      total,
      page: pageNum,
      limit: lim,
      totalPages: Math.ceil(total / lim) || 1,
    },
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
  autoCancelExpiredPendingOrders,
  rateSeller,
  resolveOrderDispute,
   getSellerReviews,
};
