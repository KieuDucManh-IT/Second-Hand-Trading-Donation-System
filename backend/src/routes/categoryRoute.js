const express = require('express');
const router  = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');
 
router.get('/',        getCategories);
router.post('/',       protect, authorize('manager'), createCategory);
router.put('/:id',     protect, authorize('manager'), updateCategory);
router.delete('/:id',  protect, authorize('manager'), deleteCategory);
 
module.exports = router;
 