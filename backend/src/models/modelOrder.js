const mongoose = require('mongoose');
 
const PLATFORM_FEE_RATE = 0.1; // 10% phí nền tảng
 
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
      comment: 'Số tiền buyer trả (= giá gốc sản phẩm)',
    },
    platformFeeRate: {
      type: Number,
      default: PLATFORM_FEE_RATE, 
    },
    platformFee: {
      type: Number,
      required: true,
      comment: 'Phí nền tảng = totalPrice * 10%',
    },
    sellerReceives: {
      type: Number,
      required: true,
      comment: 'Seller nhận = totalPrice * 90%',
    },
 
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
 
    
    cancelReason: { type: String, default: '' },
 

    confirmedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
 
    // Đã cộng balance cho seller chưa (tránh double-credit)
    balanceCredited: { type: Boolean, default: false },
  },
  { timestamps: true }
);
orderSchema.pre('validate', function (next) {
  if (this.isNew && this.totalPrice != null) {
    this.platformFee    = parseFloat((this.totalPrice * this.platformFeeRate).toFixed(0));
    this.sellerReceives = parseFloat((this.totalPrice - this.platformFee).toFixed(0));
  }
  next();
});
 

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ status: 1 });
 
module.exports = mongoose.model('Order', orderSchema);
 