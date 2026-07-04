const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const uploadComplaintEvidence = require("../middlewares/uploadComplaintEvidenceMiddleware");
const exchangeEscrowController = require("../controllers/exchangeEscrowController");

router.get(
  "/my",
  protect,
  exchangeEscrowController.getMyExchangeInvoices
);

router.get(
  "/:invoiceId",
  protect,
  exchangeEscrowController.getExchangeInvoiceDetail
);

router.post(
  "/request",
  protect,
  exchangeEscrowController.createExchangeRequest
);

router.post(
  "/:invoiceId/accept",
  protect,
  exchangeEscrowController.acceptExchangeRequest
);

router.post(
  "/:invoiceId/pay-deposit",
  protect,
  exchangeEscrowController.payExchangeDeposit
);

router.post(
  "/:invoiceId/delivery-video",
  protect,
  uploadComplaintEvidence.single("deliveryVideo"),
  exchangeEscrowController.uploadDeliveryVideo
);

router.post(
  "/:invoiceId/confirm-completed",
  protect,
  exchangeEscrowController.confirmExchangeCompleted
);

router.post(
  "/:invoiceId/dispute",
  protect,
  uploadComplaintEvidence.array("evidences", 5),
  exchangeEscrowController.disputeExchange
);

router.post(
  "/auto-release",
  protect,
  exchangeEscrowController.manualAutoRelease
);

router.post(
  "/:invoiceId/reject",
  protect,
  exchangeEscrowController.rejectExchangeRequest
);

module.exports = router;