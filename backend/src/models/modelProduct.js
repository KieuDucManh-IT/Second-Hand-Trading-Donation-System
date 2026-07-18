const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      required: true,
    },
    type: {
      type: String,
      enum: ['sell', 'donate'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved', 'hidden'],
      default: 'available',      
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String, default: '' },
    },
    exchangeStatus: {
      type: String,
      enum: ["none", "pending", "locked"],
      default: "none",
    },
    isAvailable: { type: Boolean, default: true },
    pendingApproval: { type: Boolean, default: false, index: true },
    rejectReason: { type: String, default: '' },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ location: '2dsphere' });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ categoryId: 1, status: 1, isAvailable: 1 });
productSchema.index({ ownerId: 1 });
productSchema.index({ pendingApproval: 1, createdAt: -1 });
module.exports = mongoose.model('Product', productSchema);
