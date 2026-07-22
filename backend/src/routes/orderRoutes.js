const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const uploadComplaintEvidence = require("../middlewares/uploadComplaintEvidenceMiddleware");
const orderEscrowController = require("../controllers/orderEscrowController");
const multer = require("multer");

const uploadShippingProof = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép upload ảnh (jpg, png, webp)"), false);
    }
  },
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
});

router.get("/seller/:sellerId/reviews", orderEscrowController.getSellerReviews);
router.post("/", protect, orderEscrowController.createOrder);
router.get("/my/buying", protect, orderEscrowController.getMyBuyingOrders);
router.get("/my/selling", protect, orderEscrowController.getMySellingOrders);
router.get("/:orderId", protect, orderEscrowController.getOrderById);

router.post("/:orderId/pay", protect, orderEscrowController.payOrderByWallet);
router.post("/:orderId/confirm", protect, orderEscrowController.sellerConfirmOrder);
router.post("/:orderId/cancel", protect, orderEscrowController.cancelOrderAndRefund);
router.post("/:orderId/ship", protect, uploadShippingProof.array("shippingProofImages", 5), orderEscrowController.markOrderShipping);
router.post("/:orderId/deliver", protect, orderEscrowController.markOrderDelivered);
router.post("/:orderId/receive", protect, orderEscrowController.buyerConfirmReceived);
router.post("/:orderId/dispute", protect, uploadComplaintEvidence.array("evidenceFiles", 5), orderEscrowController.openOrderDispute);

router.post("/auto-release", protect, orderEscrowController.manualRunAutoRelease);
router.post("/auto-cancel-pending", protect, orderEscrowController.manualRunAutoCancelPending);
router.post("/:orderId/rate-seller", protect, uploadShippingProof.array("evidenceFiles", 5), orderEscrowController.rateSeller);

module.exports = router;