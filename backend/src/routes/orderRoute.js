const express = require('express');
const router  = express.Router();
 
const {
  createOrder,
  confirmOrder,
  completeOrder,
  cancelOrder,
  getMyPurchases,
  getMySales,
  getOrderById,
} = require('../controllers/orderController');
 
const { protect } = require('../middlewares/authMiddleware');
 
// Tất cả route đều yêu cầu đăng nhập
router.use(protect);
 
// ── Tạo đơn hàng ──────────────────────────────────────────────────────────────
router.post('/', createOrder);
 
// ── Xem đơn hàng của tôi ──────────────────────────────────────────────────────
router.get('/my-purchases', getMyPurchases); // buyer
router.get('/my-sales',     getMySales);     // seller
 
// ── Chi tiết 1 đơn ────────────────────────────────────────────────────────────
router.get('/:id', getOrderById);
 
// ── Cập nhật trạng thái ───────────────────────────────────────────────────────
router.put('/:id/confirm',  confirmOrder);  // seller xác nhận
router.put('/:id/complete', completeOrder); // seller bấm "đã giao" → trừ 10%
router.put('/:id/cancel',   cancelOrder);   // buyer hoặc seller hủy
 
module.exports = router;