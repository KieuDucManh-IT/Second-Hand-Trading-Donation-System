const express = require("express");
const router = express.Router();

const donationController = require(
  "../controllers/donationController"
);
const { protect } = require("../middlewares/authMiddleware");
router.get(
  "/",
  protect,
  donationController.getMyDonations
);

router.post(
  "/request",
  protect,
  donationController.requestDonation
);

router.put(
  "/accept/:id",
  donationController.acceptDonation
);

router.put(
  "/reject/:id",
  donationController.rejectDonation
);

router.put(
  "/delivery/:id",
  donationController.updateDeliveryStatus
);

module.exports = router;