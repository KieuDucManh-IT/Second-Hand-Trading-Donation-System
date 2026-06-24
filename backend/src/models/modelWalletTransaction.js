const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },



    status: {
      type: String,
      enum: ["pending", "completed", "failed", "rejected", "expired"],
      default: "pending",
      index: true,
    },

    amount: {
      type: mongoose.Decimal128,
      required: true,
      min: 1000,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    transferContent: {
      type: String,
    },

    bankInfo: {
      bankCode: String,
      bankName: String,
      accountNumber: String,
      accountName: String,
    },

    provider: {
      type: String,
      enum: ["payos", "manual"],
      default: "payos",
    },

    orderCode: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "withdraw",
        "purchase_payment",
        "escrow_hold",
        "escrow_release",
        "refund",

        "exchange_deposit",
        "exchange_refund",
        "exchange_fee"
      ],
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    exchangeInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExchangeInvoice",
    },

    metadata: {
      type: Object,
      default: {},
    },

    paymentLinkId: String,
    checkoutUrl: String,
    qrCode: String,

    payoutId: String,
    payoutReferenceId: String,

    providerStatus: String,
    providerPayload: Object,

    externalRef: {
      type: String,
      index: true,
    },

    note: String,

    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);