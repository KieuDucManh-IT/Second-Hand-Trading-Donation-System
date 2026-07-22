const payOS = require("../config/payos");
const WalletTransaction = require("../models/modelWalletTransaction");
const { completeDeposit, decimalToNumber } = require("../services/dipositService");

exports.handlePayosWebhook = async (req, res) => {
  try {
    console.log("PAYOS WEBHOOK RAW:", JSON.stringify(req.body, null, 2));

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(200).json({ success: true, message: "Webhook test received" });
    }

    let paymentData;

    try {
      // SDK v2 trả về phần data đã xác minh chữ ký.
      paymentData = await payOS.webhooks.verify(req.body);
    } catch (verifyError) {
      console.error("PAYOS VERIFY ERROR:", verifyError.message);
      return res.status(400).json({
        success: false,
        message: "Webhook không hợp lệ",
        error: verifyError.message,
      });
    }

    if (!paymentData?.orderCode) {
      return res.status(200).json({
        success: true,
        message: "Webhook received but no orderCode",
      });
    }

    const orderCode = Number(paymentData.orderCode);
    const paidAmount = Number(paymentData.amount);
    const paymentCode = String(paymentData.code || req.body.code || "").toUpperCase();
    const paymentStatus = String(paymentData.status || req.body.status || "").toUpperCase();

    const transaction = await WalletTransaction.findOne({
      type: "deposit",
      orderCode,
    });

    if (!transaction) {
      // Trả 200 để payOS không gửi lặp vô hạn cho order không tồn tại ở hệ thống này.
      return res.status(200).json({
        success: true,
        message: "Transaction not found, webhook ignored",
      });
    }

    if (transaction.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Transaction already completed",
      });
    }

    const expectedAmount = decimalToNumber(transaction.amount);

    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
      transaction.status = "failed";
      transaction.providerStatus = "AMOUNT_MISMATCH";
      transaction.providerPayload = req.body;
      transaction.note = `Số tiền không khớp. Expected ${expectedAmount}, got ${paidAmount}`;
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: "Amount mismatch processed",
      });
    }

    // Webhook thanh toán thành công của payOS có code 00.
    const paymentSuccess =
      req.body.success === true &&
      (paymentCode === "00" || paymentStatus === "PAID" || paymentStatus === "SUCCESS");

    if (!paymentSuccess) {
      transaction.providerStatus = paymentCode || paymentStatus || "WEBHOOK_NOT_SUCCESS";
      transaction.providerPayload = req.body;
      transaction.note = "Đã nhận webhook payOS nhưng chưa xác định là thanh toán thành công";
      await transaction.save();

      // Không chuyển failed chỉ vì một payload chưa phải success; API sync vẫn có thể đối soát lại.
      return res.status(200).json({
        success: true,
        message: "Non-success webhook recorded",
      });
    }

    const result = await completeDeposit({
      transactionId: transaction._id,
      providerPayload: req.body,
      providerStatus: "PAID",
      note: "Nạp tiền tự động thành công qua webhook payOS",
    });

    console.log("PAYOS WEBHOOK COMPLETED:", {
      orderCode,
      wasCompletedNow: result.wasCompletedNow,
    });

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("PAYOS WEBHOOK ERROR:", error);
    // Trả 500 để payOS có thể gửi lại webhook khi lỗi hệ thống tạm thời.
    return res.status(500).json({
      success: false,
      message: "Webhook server error",
      error: error.message,
    });
  }
};
