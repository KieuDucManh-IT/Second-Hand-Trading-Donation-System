const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    condition: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["sale", "exchange", "donation"],
      default: "sale",
    },
    status: {
      type: String,
      enum: ["draft", "pending", "active", "sold", "archived"],
      default: "active",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Product", productSchema);
