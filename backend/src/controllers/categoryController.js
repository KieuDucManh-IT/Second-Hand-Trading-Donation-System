const Category = re1quire('../models/modelCategory');
 
// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};
 
// POST /api/categories  (admin / manager only)
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};
 