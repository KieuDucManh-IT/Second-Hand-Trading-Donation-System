const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const walletController = require("../controllers/walletController");

router.get("/", protect, walletController.getMyWallet);

router.post(
  "/password/send-otp",
  protect,
  walletController.sendWalletPasswordOTP
);

router.post(
  "/password/setup",
  protect,
  walletController.setupWalletPassword
);

router.post(
  "/withdraw/send-otp",
  protect,
  walletController.sendWithdrawOTP
);

router.post(
  "/withdraw/confirm",
  protect,
  walletController.confirmWithdrawOTP
);

router.post(
  "/withdraw/:transactionId/sync",
  protect,
  walletController.syncWithdrawStatus
);

router.get("/transactions", protect, walletController.getMyTransactions);
router.post("/deposit", protect, walletController.createDepositRequest);
router.post("/deposit/:orderCode/sync", protect, walletController.syncDepositStatus);
router.post("/withdraw", protect, walletController.createWithdrawRequest);

module.exports = router;