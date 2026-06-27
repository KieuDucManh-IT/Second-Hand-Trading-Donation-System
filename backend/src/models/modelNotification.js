const mongoose = require("mongoose");
 
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        // Đơn hàng
        "order_created",           // Người bán: có đơn hàng mới
        "order_confirmed",         // Người mua: đơn hàng được xác nhận
        "order_shipping",          // Người mua: đơn hàng đang giao
        "order_delivered",         // Người mua: đơn hàng đã giao
        "order_completed",         // Cả hai: đơn hàng hoàn thành
        "order_cancelled",         // Cả hai: đơn hàng bị huỷ
        "order_disputed",          // Người bán: đơn hàng bị khiếu nại
        // Ví
        "wallet_deposit_success",  // Nạp tiền vào ví thành công
        "wallet_received",         // Tiền về ví (bán hàng / hoàn tiền)
        "wallet_refunded",         // Hoàn tiền về ví
        // Report
        "report_received",         // Manager / người bị report
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // Dữ liệu phụ để frontend điều hướng
    data: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      amount: Number,
      currency: { type: String, default: "VND" },
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);
 
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
 
module.exports = mongoose.model("Notification", notificationSchema);