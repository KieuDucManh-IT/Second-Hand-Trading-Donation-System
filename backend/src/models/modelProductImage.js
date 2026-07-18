const mongoose = require('mongoose');
 
const productImageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true }, 
    order:    { type: Number, default: 0 },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model('ProductImage', productImageSchema);