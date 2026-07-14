const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    // Thông tin nhận hàng người xin donation cung cấp, để người tặng biết gửi đi đâu
    shippingInfo: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    rejectReason: {
  type: String,
  default: "",
},

deliveryStatus: {
    type: String,
    enum: ["shipping", "delivered"],
    default: "shipping",
},

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "completed"
      ],
      default: "pending",
    },

    acceptedAt: Date,
    rejectedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Donation",
  donationSchema
);