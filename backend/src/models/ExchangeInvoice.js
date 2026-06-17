const mongoose = require("mongoose");

const exchangeInvoiceSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requesterProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    receiverProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    requesterDepositAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    receiverDepositAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalInvoiceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    feeRate: {
      type: Number,
      default: 0.1,
    },

    requesterFee: {
      type: Number,
      default: 0,
    },

    receiverFee: {
      type: Number,
      default: 0,
    },

    requesterRefundAmount: {
      type: Number,
      default: 0,
    },

    receiverRefundAmount: {
      type: Number,
      default: 0,
    },

    requesterDepositStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "forfeited"],
      default: "unpaid",
    },

    receiverDepositStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "forfeited"],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: [
        "pending_receiver_accept",
        "accepted",
        "waiting_deposits",
        "active",
        "both_confirmed",
        "completed",
        "cancelled",
        "disputed"
      ],
      default: "pending_receiver_accept",
      index: true,
    },

    requesterConfirmed: {
      type: Boolean,
      default: false,
    },

    receiverConfirmed: {
      type: Boolean,
      default: false,
    },

    acceptedAt: Date,
    activeAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    disputedAt: Date,

    autoReleaseAt: Date,

    cancelReason: String,
    disputeReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExchangeInvoice", exchangeInvoiceSchema);