
const payOS = require("../config/payos");
const Wallet = require("../models/modelWallet");
const WalletTransaction = require("../models/modelWalletTransaction");
const { sendNotification } = require("../utils/notificationHelper");
 
function getIO() {
  return global.__io || null;
}
 
exports.handlePayosWebhook = async (req, res) => {
  try {
    console.log("PAYOS WEBHOOK RAW:", JSON.stringify(req.body, null, 2));
 
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(200).json({ success: true, message: "Webhook test received" });
    }
 
    let verifiedData;
    try {
      verifiedData = payOS.webhooks.verify(req.body);
    } catch (verifyError) {
      console.error("PAYOS VERIFY ERROR:", verifyError.message);
      return res.status(400).json({ success: false, message: "Webhook không hợp lệ", error: verifyError.message });
    }
 
    const paymentData =
      verifiedData?.orderCode
        ? verifiedData
        : verifiedData?.data
          ? verifiedData.data
          : req.body?.data;
 
    if (!paymentData || !paymentData.orderCode) {
      return res.status(200).json({ success: true, message: "Webhook received but no orderCode" });
    }
 
    const orderCode = Number(paymentData.orderCode);
    const paidAmount = Number(paymentData.amount);
    const paymentCode = paymentData.code || req.body.code;
    const paymentDesc = paymentData.desc || req.body.desc;
    const paymentStatus = paymentData.status || req.body.status;
 
    const paymentSuccess =
      req.body.success === true ||
      paymentCode === "00" ||
      paymentDesc === "success" ||
      paymentStatus === "PAID" ||
      paymentStatus === "SUCCESS";
 
    const transaction = await WalletTransaction.findOne({
      type: "deposit",
      $or: [
        { orderCode: orderCode },
        { orderCode: String(orderCode) },
        { code: `DEP${orderCode}` },
      ],
    });
 
    if (!transaction) {
      return res.status(200).json({ success: true, message: "Transaction not found, webhook ignored" });
    }
 
    if (transaction.status === "completed") {
      return res.status(200).json({ success: true, message: "Transaction already completed" });
    }
 
    if (!paymentSuccess) {
      transaction.status = "failed";
      transaction.providerStatus = paymentCode || paymentStatus || "failed";
      transaction.providerPayload = req.body;
      transaction.note = "payOS báo giao dịch không thành công";
      await transaction.save();
      return res.status(200).json({ success: true, message: "Payment failed webhook processed" });
    }
 
    if (Number.isFinite(paidAmount) && paidAmount !== Number(transaction.amount)) {
      transaction.status = "failed";
      transaction.providerStatus = "amount_mismatch";
      transaction.providerPayload = req.body;
      transaction.note = `Số tiền không khớp. Expected ${transaction.amount}, got ${paidAmount}`;
      await transaction.save();
      return res.status(200).json({ success: true, message: "Amount mismatch processed" });
    }
 
    const updateResult = await WalletTransaction.updateOne(
      { _id: transaction._id, status: { $ne: "completed" } },
      {
        $set: {
          status: "completed",
          providerStatus: "paid",
          providerPayload: req.body,
          completedAt: new Date(),
          note: "Nạp tiền tự động thành công qua payOS",
        },
      }
    );
 
    if (updateResult.modifiedCount === 1) {
      await Wallet.updateOne(
        { _id: transaction.wallet },
        { $inc: { balance: transaction.amount } }
      );
 
      console.log("Đã cộng tiền vào ví:", { wallet: transaction.wallet, amount: transaction.amount, orderCode });
 

      sendNotification(getIO(), {
        userId: String(transaction.user),
        type: "wallet_deposit_success",
        title: "Nạp tiền thành công",
        message: `${Number(transaction.amount).toLocaleString("vi-VN")}₫ đã được nạp vào ví của bạn thành công.`,
        data: { amount: transaction.amount, currency: "VND" },
      });
    }
 
    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("PAYOS WEBHOOK ERROR:", error);
    return res.status(500).json({ success: false, message: "Webhook server error", error: error.message });
  }
};