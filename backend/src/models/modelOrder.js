const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    
    paymentMethod: {
      type: String,
      enum: ["wallet", "payos", "cod"],
      default: "cod",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "released", "refunded"],
      default: "unpaid",
    },

    escrowStatus: {
      type: String,
      enum: ["none", "holding", "released", "refunded", "disputed"],
      default: "none",
    },

    escrowAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "pending_seller_confirm",
        "confirmed",
        "shipping",
        "delivered",
        "completed",
        "cancelled",
        "disputed"
      ],
      default: "pending_seller_confirm",
    },

    paidAt: Date,
    sellerConfirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    confirmDeadline: Date,
    releasedAt: Date,
    refundedAt: Date,
    cancelledAt: Date,

    cancelReason: String,
    releaseReason: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Order", orderSchema);
