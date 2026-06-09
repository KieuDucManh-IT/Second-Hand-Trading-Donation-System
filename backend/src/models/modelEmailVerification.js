const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    otpCode: {
      type: String,
      required: true,
      trim: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);
