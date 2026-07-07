const mongoose = require('mongoose');
 
// Mỗi user có 1 cart document, items là mảng productId
// Hàng cũ: mỗi sản phẩm là unique → quantity luôn = 1, không cho thêm trùng
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 1 user = 1 cart
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);
 
// Index để tìm nhanh
// Lưu ý: userId đã có unique: true ở trên -> Mongoose tự tạo index rồi,
// không cần khai báo cartSchema.index({ userId: 1 }) nữa (tránh warning duplicate index)
cartSchema.index({ 'items.productId': 1 });
 
module.exports = mongoose.model('Cart', cartSchema);