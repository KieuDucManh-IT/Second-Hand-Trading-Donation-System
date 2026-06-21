const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const walletController = require("../controllers/walletController");

router.get("/", protect, walletController.getMyWallet);
router.post("/deposit", protect, walletController.createDepositRequest);
router.post("/withdraw", protect, walletController.createWithdrawRequest);
router.post("/withdraw/:transactionId/sync", protect, walletController.syncWithdrawStatus);

module.exports = router;