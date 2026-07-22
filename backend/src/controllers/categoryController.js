const Category = require('../models/modelCategory');
 
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};
 
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Tên danh mục không được trống' });
    const cleanName = name.trim();
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegExp(cleanName)}$`, 'i') }
    });
    if (exists) return res.status(400).json({ success: false, message: 'Danh mục đã tồn tại' });
    const category = await Category.create({ name: cleanName, description, icon });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};
 
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    if (name) {
      const cleanName = name.trim();
      const exists = await Category.findOne({
        name: { $regex: new RegExp(`^${escapeRegExp(cleanName)}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (exists) return res.status(400).json({ success: false, message: 'Danh mục đã tồn tại' });
      category.name = cleanName;
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    await category.save();
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};
 
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    await category.deleteOne();
    res.json({ success: true, message: 'Đã xoá danh mục' });
  } catch (err) { next(err); }
};