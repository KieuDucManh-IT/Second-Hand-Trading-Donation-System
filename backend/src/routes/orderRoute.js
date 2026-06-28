const express = require("express");
const router  = express.Router();
 
const { protect } = require("../middlewares/authMiddleware");
 
const {
  createOrder,
  getMyPurchases,
  getMySales,
  getOrderById,
} = require("../controllers/orderController");
 
const {
  payOrderByWallet,
  sellerConfirmOrder,
  markOrderShipping,
  markOrderDelivered,
  buyerConfirmReceived,
  cancelOrderAndRefund,
  openOrderDispute,
  manualRunAutoRelease,
} = require("../controllers/orderEscrowController");
 
const uploadComplaintEvidence = require("../middlewares/uploadComplaintEvidenceMiddleware");

// Tất cả route đều yêu cầu đăng nhập
router.use(protect);
 
// ── Tạo đơn hàng ──────────────────────────────────────────────────────────────
router.post("/", createOrder);
 
// ── Xem đơn hàng ──────────────────────────────────────────────────────────────
router.get("/my-purchases", getMyPurchases);   // buyer
router.get("/my-sales",     getMySales);       // seller
 
// ── Chi tiết 1 đơn ────────────────────────────────────────────────────────────
router.get("/:orderId", getOrderById);
 
// ── Thanh toán qua ví (buyer) ─────────────────────────────────────────────────
router.post("/:orderId/pay-wallet", payOrderByWallet);
 
// ── Vòng đời đơn hàng ─────────────────────────────────────────────────────────
router.put("/:orderId/confirm",           sellerConfirmOrder);    // seller xác nhận
router.put("/:orderId/shipping",          markOrderShipping);     // seller: đang giao
router.put("/:orderId/delivered",         markOrderDelivered);    // seller: đã giao
router.put("/:orderId/confirm-received",  buyerConfirmReceived);  // buyer: đã nhận
router.put("/:orderId/cancel",            cancelOrderAndRefund);  // buyer/seller huỷ
router.put("/:orderId/dispute",           uploadComplaintEvidence.array("evidences", 5), openOrderDispute);      // buyer khiếu nại
 
// ── Admin / cron ───────────────────────────────────────────────────────────────
router.post("/admin/auto-release", manualRunAutoRelease);
 
module.exports = router;