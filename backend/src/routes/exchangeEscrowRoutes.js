const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const uploadComplaintEvidence = require("../middlewares/uploadComplaintEvidenceMiddleware");
const exchangeEscrowController = require("../controllers/exchangeEscrowController");

// Lấy danh sách hóa đơn trao đổi của user hiện tại
router.get(
  "/my",
  protect,
  exchangeEscrowController.getMyExchangeInvoices
);

// Lấy chi tiết 1 hóa đơn trao đổi
router.get(
  "/:invoiceId",
  protect,
  exchangeEscrowController.getExchangeInvoiceDetail
);

// Tạo yêu cầu trao đổi
router.post(
  "/request",
  protect,
  exchangeEscrowController.createExchangeRequest
);

// Người nhận đồng ý trao đổi
router.post(
  "/:invoiceId/accept",
  protect,
  exchangeEscrowController.acceptExchangeRequest
);

// Thanh toán tiền bảo hiểm
router.post(
  "/:invoiceId/pay-deposit",
  protect,
  exchangeEscrowController.payExchangeDeposit
);

// Xác nhận hoàn tất trao đổi
router.post(
  "/:invoiceId/confirm-completed",
  protect,
  exchangeEscrowController.confirmExchangeCompleted
);

// Khiếu nại + upload ảnh/video bằng chứng
router.post(
  "/:invoiceId/dispute",
  protect,
  uploadComplaintEvidence.array("evidences", 5),
  exchangeEscrowController.disputeExchange
);

// Test thủ công auto release
router.post(
  "/auto-release",
  protect,
  exchangeEscrowController.manualAutoRelease
);

module.exports = router;