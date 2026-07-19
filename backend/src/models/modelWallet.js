const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    walletPasswordHash: {
      type: String,
      default: null,
      select: false,
    },

    walletPasswordFailedAttempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    walletPasswordLockedUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);
walletSchema.methods.setWalletPassword = async function (password) {
  this.walletPasswordHash = await bcrypt.hash(password, 12);
  this.walletPasswordFailedAttempts = 0;
  this.walletPasswordLockedUntil = null;
};

walletSchema.methods.compareWalletPassword = async function (password) {
  if (!this.walletPasswordHash) {
    return false;
  }

  return bcrypt.compare(password, this.walletPasswordHash);
};

module.exports = mongoose.model("Wallet", walletSchema);