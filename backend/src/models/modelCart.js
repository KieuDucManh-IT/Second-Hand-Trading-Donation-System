
 
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
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
 

cartSchema.index({ 'items.productId': 1 });
 
module.exports = mongoose.model('Cart', cartSchema);
