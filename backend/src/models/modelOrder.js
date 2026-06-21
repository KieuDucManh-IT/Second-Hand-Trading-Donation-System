const mongoose = require('mongoose');
 
const PLATFORM_FEE_RATE = 0.1; // 10%
 
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
 
    // ── Tài chính ─────────────────────────────────────────────────────────────
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      comment: 'Số tiền buyer trả (= giá gốc sản phẩm)',
    },
    platformFeeRate: {
      type: Number,
      default: PLATFORM_FEE_RATE, // lưu lại tỉ lệ tại thời điểm tạo đơn
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
 
    // ── Trạng thái đơn hàng ───────────────────────────────────────────────────
    // pending   → buyer vừa đặt, chờ seller xác nhận
    // confirmed → seller xác nhận sẽ giao
    // completed → giao thành công, tiền được tính
    // cancelled → hủy (buyer hoặc seller)
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
 
    // Lý do hủy (nếu có)
    cancelReason: { type: String, default: '' },
 
    // Thời gian mốc
    confirmedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
 
    // Đã cộng balance cho seller chưa (tránh double-credit)
    balanceCredited: { type: Boolean, default: false },
  },
  { timestamps: true }
);
 
// ── Tính tự động phí trước khi save ──────────────────────────────────────────
orderSchema.pre('validate', function (next) {
  if (this.isNew && this.totalPrice != null) {
    this.platformFee    = parseFloat((this.totalPrice * this.platformFeeRate).toFixed(0));
    this.sellerReceives = parseFloat((this.totalPrice - this.platformFee).toFixed(0));
  }
  next();
});
 
// ── Index ─────────────────────────────────────────────────────────────────────
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ status: 1 });
 
module.exports = mongoose.model('Order', orderSchema);
 