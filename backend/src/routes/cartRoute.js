const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  checkout,
} = require('../controllers/cartController');
 
router.use(protect); 
 
router.get('/',                       getCart);          
router.post('/add',                   addToCart);        
router.delete('/remove/:productId',   removeFromCart);   
router.delete('/clear',               clearCart);        
router.post('/checkout',              checkout);       
 
module.exports = router;
 