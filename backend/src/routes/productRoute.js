const express = require('express');
const router  = express.Router();
 
const {
  createProduct,
  uploadImages,
  deleteImage,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getMyProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct,
} = require('../controllers/productController');
 
const { protect }       = require('../middlewares/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');

// Middleware kiểm tra role manager
const requireManager = (req, res, next) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Chỉ manager mới có quyền này' });
  }
  next();
};
 
// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/',               getProducts);
router.get('/seller/:userId', getSellerProducts);
router.get('/my',      protect,                       getMyProducts);
router.get('/pending', protect, requireManager,       getPendingProducts);

router.get('/:id', getProductById);
 
// ── User protected routes ────────────────────────────────────────────────────
router.post('/',                  protect, createProduct);
router.post('/:id/images',        protect, uploadProduct.array('images', 8), uploadImages);
router.delete('/images/:imageId', protect, deleteImage);
router.put('/:id',                protect, updateProduct);
router.delete('/:id',             protect, deleteProduct);
 
// ── Manager routes ────────────────────────────────────────────────────────────
router.put('/:id/approve', protect, requireManager, approveProduct);
router.put('/:id/reject',  protect, requireManager, rejectProduct);
 
module.exports = router;