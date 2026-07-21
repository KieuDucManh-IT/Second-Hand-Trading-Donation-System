const express = require('express');
const router  = express.Router();

const {
  createProduct,
  uploadImages,
  deleteImage,
  getProducts,
  getProductById,
  deleteProduct,
  getSellerProducts,
  getMyProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getMyProductsForExchange,
  getSensitiveWordsRoute,
  getProductReviews,
  toggleFavorite,
  getFavoriteProducts,
} = require('../controllers/productController');

const { protect }       = require('../middlewares/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');
 
const requireManager = (req, res, next) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Chỉ manager mới có quyền này' });
  }
  next();
};
 
router.get('/', getProducts);
router.get('/sensitive-words', getSensitiveWordsRoute);
router.get('/seller/:userId', getSellerProducts);

router.get('/my', protect, getMyProducts);
router.get("/my/exchange", protect, getMyProductsForExchange);
router.get('/favorites', protect, getFavoriteProducts);

router.get('/pending', protect, requireManager, getPendingProducts);

router.get('/:id/reviews', getProductReviews);

router.get('/:id', getProductById);

router.post('/', protect, createProduct);
router.post('/:id/images', protect, uploadProduct.array('images', 8), uploadImages);
router.delete('/images/:imageId', protect, deleteImage);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/favorite', protect, toggleFavorite);

router.put('/:id/approve', protect, requireManager, approveProduct);
router.put('/:id/reject', protect, requireManager, rejectProduct);

 
module.exports = router;