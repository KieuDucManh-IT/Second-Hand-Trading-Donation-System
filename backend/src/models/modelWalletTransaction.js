const mongoose = require("mongoose");
const crypto = require("crypto");

function getBankEncryptionKey() {
  const key = process.env.WALLET_BANK_ENCRYPTION_KEY;

  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error(
      "WALLET_BANK_ENCRYPTION_KEY phải là chuỗi hex 64 ký tự"
    );
  }

  return Buffer.from(key, "hex");
}

function encryptBankValue(value) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getBankEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptBankValue({ encrypted, iv, authTag }) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getBankEncryptionKey(),
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

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
      bankCode: {
        type: String,
      },

      bankName: {
        type: String,
      },

      accountNumberEncrypted: {
        type: String,
        select: false,
      },

      accountNumberIv: {
        type: String,
        select: false,
      },

      accountNumberAuthTag: {
        type: String,
        select: false,
      },

      accountNumberLast4: {
        type: String,
      },

      accountNameEncrypted: {
        type: String,
        select: false,
      },

      accountNameIv: {
        type: String,
        select: false,
      },

      accountNameAuthTag: {
        type: String,
        select: false,
      },
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
  {
    timestamps: true,

    toJSON: {
      transform: function (_, ret) {
        if (ret.bankInfo) {
          ret.bankInfo.accountNumber = ret.bankInfo.accountNumberLast4
            ? `******${ret.bankInfo.accountNumberLast4}`
            : undefined;

          delete ret.bankInfo.accountNumberEncrypted;
          delete ret.bankInfo.accountNumberIv;
          delete ret.bankInfo.accountNumberAuthTag;
          delete ret.bankInfo.accountNameEncrypted;
          delete ret.bankInfo.accountNameIv;
          delete ret.bankInfo.accountNameAuthTag;
          delete ret.bankInfo.accountName;
        }

        // Không trả toàn bộ dữ liệu payOS cho frontend
        delete ret.providerPayload;

        return ret;
      },
    },
  }
);
walletTransactionSchema.methods.setEncryptedBankInfo = function ({
  bankCode,
  bankName,
  accountNumber,
  accountName,
}) {
  const encryptedAccountNumber = encryptBankValue(accountNumber);
  const encryptedAccountName = encryptBankValue(accountName);

  this.bankInfo = {
    bankCode,
    bankName,

    accountNumberEncrypted: encryptedAccountNumber.encrypted,
    accountNumberIv: encryptedAccountNumber.iv,
    accountNumberAuthTag: encryptedAccountNumber.authTag,
    accountNumberLast4: String(accountNumber).slice(-4),

    accountNameEncrypted: encryptedAccountName.encrypted,
    accountNameIv: encryptedAccountName.iv,
    accountNameAuthTag: encryptedAccountName.authTag,
  };
};

walletTransactionSchema.methods.getDecryptedBankInfo = function () {
  if (
    !this.bankInfo?.accountNumberEncrypted ||
    !this.bankInfo?.accountNumberIv ||
    !this.bankInfo?.accountNumberAuthTag
  ) {
    throw new Error("Không tìm thấy thông tin tài khoản ngân hàng đã mã hóa");
  }

  const accountNumber = decryptBankValue({
    encrypted: this.bankInfo.accountNumberEncrypted,
    iv: this.bankInfo.accountNumberIv,
    authTag: this.bankInfo.accountNumberAuthTag,
  });

  const accountName = decryptBankValue({
    encrypted: this.bankInfo.accountNameEncrypted,
    iv: this.bankInfo.accountNameIv,
    authTag: this.bankInfo.accountNameAuthTag,
  });

  return {
    bankCode: this.bankInfo.bankCode,
    bankName: this.bankInfo.bankName,
    accountNumber,
    accountName,
  };
};

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);