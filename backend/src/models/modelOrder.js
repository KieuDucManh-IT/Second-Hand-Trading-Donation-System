const mongoose = require('mongoose');
 
const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.1);
 
const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
 
    // Giá & phí
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeeRate: {
      type: Number,
      default: PLATFORM_FEE_RATE,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    sellerReceives: {
      type: Number,
      required: true,
    },
 
    // Phương thức & trạng thái thanh toán
    paymentMethod: {
      type: String,
      enum: ["wallet", "cod"],
      default: "wallet",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "released", "refunded"],
      default: "unpaid",
    },
 
    // Escrow
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
 
    // Trạng thái đơn hàng
    orderStatus: {
      type: String,
      enum: [
        "pending_seller_confirm",
        "confirmed",
        "shipping",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending_seller_confirm",
    },
 
    // Thông tin giao hàng (tuỳ chọn)
    shippingInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
    },
 
    // Timestamps nghiệp vụ
    paidAt: Date,
    sellerConfirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    confirmDeadline: Date, // deadline 7 ngày buyer xác nhận sau khi delivered
    releasedAt: Date,
    refundedAt: Date,
    cancelledAt: Date,
 
    cancelReason: String,
    releaseReason: String,

   
    paymentDeadline: Date,

    
    sellerRating: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      ratedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);
 

orderSchema.pre("validate", function () {
  if (this.isNew && this.totalPrice != null) {
    const rate = this.platformFeeRate ?? PLATFORM_FEE_RATE;
    this.platformFee    = Math.round(this.totalPrice * rate);
    this.sellerReceives = this.totalPrice - this.platformFee;

    
    if (!this.paymentDeadline) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      this.paymentDeadline = deadline;
    }
  }
});
 
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ confirmDeadline: 1, orderStatus: 1 }); // cho auto-release job
 
module.exports = mongoose.model("Order", orderSchema);