const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const orderEscrowController = require("../controllers/orderEscrowController");

// Create and query orders
router.post("/", protect, orderEscrowController.createOrder);
router.get("/my/buying", protect, orderEscrowController.getMyBuyingOrders);
router.get("/my/selling", protect, orderEscrowController.getMySellingOrders);
router.get("/:orderId", protect, orderEscrowController.getOrderById);

// Escrow transaction actions
router.post("/:orderId/pay", protect, orderEscrowController.payOrderByWallet);
router.post("/:orderId/confirm", protect, orderEscrowController.sellerConfirmOrder);
router.post("/:orderId/cancel", protect, orderEscrowController.cancelOrderAndRefund);
router.post("/:orderId/ship", protect, orderEscrowController.markOrderShipping);
router.post("/:orderId/deliver", protect, orderEscrowController.markOrderDelivered);
router.post("/:orderId/receive", protect, orderEscrowController.buyerConfirmReceived);
router.post("/:orderId/dispute", protect, orderEscrowController.openOrderDispute);

// Admin / Manual trigger for auto release
router.post("/auto-release", protect, orderEscrowController.manualRunAutoRelease);

module.exports = router;
