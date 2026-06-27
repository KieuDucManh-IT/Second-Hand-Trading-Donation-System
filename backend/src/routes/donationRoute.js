const express = require("express");
const router = express.Router();

const donationController = require(
  "../controllers/donationController"
);
const { protect } = require("../middlewares/authMiddleware");
// Lấy danh sách request
router.get(
  "/",
  protect,
  donationController.getMyDonations
);

// Tạo request nhận đồ
router.post(
  "/request",
  donationController.requestDonation
);

// Chấp nhận
router.put(
  "/accept/:id",
  donationController.acceptDonation
);

// Từ chối
router.put(
  "/reject/:id",
  donationController.rejectDonation
);

router.put(
  "/delivery/:id",
  donationController.updateDeliveryStatus
);

module.exports = router;