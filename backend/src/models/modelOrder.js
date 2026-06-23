const mongoose = require('mongoose');
 
const PLATFORM_FEE_RATE = 0.1;
 
const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    cancelReason: { type: String, default: '' },
    confirmedAt:  { type: Date },
    completedAt:  { type: Date },
    cancelledAt:  { type: Date },
    balanceCredited: { type: Boolean, default: false },
  },
  { timestamps: true }
);
 
// Dùng async thay vì callback next() để tránh lỗi "next is not a function"
orderSchema.pre('validate', async function () {
  if (this.isNew && this.totalPrice != null) {
    const rate = this.platformFeeRate ?? PLATFORM_FEE_RATE;
    this.platformFee    = Math.round(this.totalPrice * rate);
    this.sellerReceives = this.totalPrice - this.platformFee;
  }
});
 
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ status: 1 });
 
module.exports = mongoose.model('Order', orderSchema);