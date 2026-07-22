const mongoose = require("mongoose");

const Wallet = require("../models/modelWallet");
const WalletTransaction = require("../models/modelWalletTransaction");
const { sendNotification } = require("../utils/notificationHelper");

function getIO() {
  return global.__io || null;
}

function decimalToNumber(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toString === "function") return Number(value.toString());
  return Number(value);
}

/**
 * Cộng tiền nạp vào ví theo cách idempotent.
 * Webhook và API đối soát đều gọi chung hàm này để tránh cộng tiền hai lần.
 */
async function completeDeposit({
  transactionId,
  providerPayload,
  providerStatus = "PAID",
  note = "Nạp tiền tự động thành công qua payOS",
}) {
  const session = await mongoose.startSession();
  let wasCompletedNow = false;

  try {
    await session.withTransaction(async () => {
      // Callback có thể được MongoDB tự chạy lại khi có write conflict.
      wasCompletedNow = false;

      const transaction = await WalletTransaction.findById(transactionId).session(session);

      if (!transaction) {
        throw new Error("Không tìm thấy giao dịch nạp tiền");
      }

      if (transaction.type !== "deposit") {
        throw new Error("Giao dịch không phải giao dịch nạp tiền");
      }

      // Đã xử lý trước đó: trả thành công nhưng tuyệt đối không cộng lần nữa.
      if (transaction.status === "completed") {
        return;
      }

      const amount = decimalToNumber(transaction.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Số tiền giao dịch không hợp lệ");
      }

      const walletResult = await Wallet.updateOne(
        { _id: transaction.wallet },
        { $inc: { balance: amount } },
        { session }
      );

      if (walletResult.matchedCount !== 1) {
        throw new Error("Không tìm thấy ví cần cộng tiền");
      }

      transaction.status = "completed";
      transaction.providerStatus = providerStatus;
      transaction.providerPayload = providerPayload;
      transaction.completedAt = new Date();
      transaction.note = note;
      await transaction.save({ session });

      wasCompletedNow = true;
    });
  } finally {
    await session.endSession();
  }

  const transaction = await WalletTransaction.findById(transactionId);

  if (wasCompletedNow && transaction) {
    await sendNotification(getIO(), {
      userId: String(transaction.user),
      type: "wallet_deposit_success",
      title: "Nạp tiền thành công",
      message: `${decimalToNumber(transaction.amount).toLocaleString("vi-VN")}₫ đã được nạp vào ví của bạn thành công.`,
      data: {
        amount: decimalToNumber(transaction.amount),
        currency: "VND",
        orderCode: transaction.orderCode,
      },
    });
  }

  return { transaction, wasCompletedNow };
}

module.exports = {
  completeDeposit,
  decimalToNumber,
};
