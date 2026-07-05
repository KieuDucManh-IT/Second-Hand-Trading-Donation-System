const mongoose = require("mongoose");

const complaintEvidenceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "image",
    },
    originalName: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    size: {
      type: Number,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    evidences: {
      type: [complaintEvidenceSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "rejected"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
    resolutionNote: String,
  },
  { _id: false }
);

const deliveryVideoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    resourceType: {
      type: String,
      enum: ["video"],
      default: "video",
    },
    originalName: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    size: {
      type: Number,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

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

    requesterLocation: {
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
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
        "disputed",
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

    requesterDeliveryVideo: {
      type: deliveryVideoSchema,
      default: undefined,
    },

    receiverDeliveryVideo: {
      type: deliveryVideoSchema,
      default: undefined,
    },

    acceptedAt: Date,
    activeAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    disputedAt: Date,

    autoReleaseAt: Date,

    autoRefundPaused: {
      type: Boolean,
      default: false,
      index: true,
    },

    cancelReason: String,

    disputeReason: String,

    disputeBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    complaint: {
      type: complaintSchema,
      default: undefined,
    },

    counterDisputeBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    counterComplaint: {
      type: complaintSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExchangeInvoice", exchangeInvoiceSchema);