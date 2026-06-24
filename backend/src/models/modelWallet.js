const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "VND",
    },

    status: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);