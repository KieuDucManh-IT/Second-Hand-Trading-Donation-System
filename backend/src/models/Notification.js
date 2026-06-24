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
        "order_new",           // seller: có đơn hàng mới
        "order_confirmed",     // buyer: seller xác nhận
        "order_shipping",      // buyer: đang giao
        "order_delivered",     // buyer: đã giao, chờ xác nhận
        "order_completed",     // cả hai: hoàn tất
        "order_cancelled",     // cả hai: bị huỷ
        "order_paid",          // seller: buyer đã thanh toán ví
        "order_disputed",      // seller: buyer khiếu nại
      ],
      required: true,
    },
    title: { type: String, required: true },
    body:  { type: String, required: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);
 
notificationSchema.index({ userId: 1, createdAt: -1 });
 
module.exports = mongoose.model("Notification", notificationSchema);