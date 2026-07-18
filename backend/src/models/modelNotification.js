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
        "order_created",
        "order_confirmed",
        "order_shipping",
        "order_delivered",
        "order_completed",
        "order_cancelled",
        "order_disputed",
        "wallet_deposit_success",
        "wallet_received",
        "wallet_refunded",
        "report_received",
        "user_status_changed",
        "user_warning",
        "product_status_changed",
        "report_resolved",
        "report_rejected",
        "dispute_resolved",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);