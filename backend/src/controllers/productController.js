const Product      = require('../models/modelProduct');
const ProductImage = require('../models/modelProductImage');
const { deleteFromCloudinary } = require('../config/cloudinary');
 
// Helper: gắn thumbnail + images vào list sản phẩm 
const attachImages = async (products) => {
  const ids = products.map((p) => p._id);
  const allImages = await ProductImage.find({ productId: { $in: ids } }).sort({ order: 1 });
  const map = {};
  allImages.forEach((img) => {
    const key = img.productId.toString();
    if (!map[key]) map[key] = [];
    map[key].push(img);
  });
  return products.map((p) => ({
    ...p,
    images:    map[p._id.toString()] || [],
    thumbnail: map[p._id.toString()]?.[0]?.imageUrl || null,
  }));
};
 

   //POST /api/products
   

exports.createProduct = async (req, res, next) => {
  try {
    const { title, description, price, condition, type, categoryId, address, longitude, latitude } = req.body;
 
    const product = await Product.create({
      ownerId: req.user._id,
      categoryId,
      title,
      description,
      price:    type === 'donate' ? 0 : Number(price) || 0,
      condition,
      type,
      location: {
        type:        'Point',
        coordinates: [Number(longitude) || 0, Number(latitude) || 0],
        address:     address || '',
      },
    });
 
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
 
// POST /api/products/:id/images(8 ảnh)
exports.uploadImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    if (product.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    if (!req.files?.length)
      return res.status(400).json({ success: false, message: 'Chưa chọn ảnh' });
 
    const existing = await ProductImage.countDocuments({ productId: product._id });
    if (existing + req.files.length > 8)
      return res.status(400).json({ success: false, message: `Tối đa 8 ảnh (đã có ${existing})` });
 
    const images = await ProductImage.insertMany(
      req.files.map((f, i) => ({
        productId: product._id,
        imageUrl:  f.path,      // URL từ Cloudinary
        publicId:  f.filename,  // public_id để xoá sau này
        order:     existing + i,
      }))
    );
 
    res.status(201).json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
};
 
// DELETE /api/products/images/:imageId
// Xoá một ảnh khỏi sản phẩm

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await ProductImage.findById(req.params.imageId).populate('productId');
    if (!image)
      return res.status(404).json({ success: false, message: 'Ảnh không tồn tại' });
    if (image.productId.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Không có quyền' });
 
    await deleteFromCloudinary(image.publicId);
    await image.deleteOne();
 
    res.json({ success: true, message: 'Đã xoá ảnh' });
  } catch (err) {
    next(err);
  }
};
 
// GET /api/products
// Danh sách + tìm kiếm + lọc + khoảng cách
 
//    Query: keyword | categoryId | type | condition (comma) |
//           minPrice | maxPrice | lat | lng | radius(km) |
//           page | limit | sort (createdAt|price_asc|price_desc|distance)

exports.getProducts = async (req, res, next) => {
  try {
    const {
      keyword, categoryId, type, condition,
      minPrice, maxPrice,
      lat, lng, radius,
      page = 1, limit = 20, sort = 'createdAt',
    } = req.query;
 
    // Build filter
    const filter = { isAvailable: true, status: 'available' };
    if (keyword)    filter.$text      = { $search: keyword };
    if (categoryId) filter.categoryId = categoryId;
    if (type)       filter.type       = type;
    if (condition)  filter.condition  = { $in: condition.split(',').map((c) => c.trim()) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
 
    const skip   = (Number(page) - 1) * Number(limit);
    const lim    = Number(limit);
    const sortMap = {
      createdAt:  { createdAt: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
    };
 
    // ── Geo query ────────────────────────────────
    if (lat && lng) {
      const radiusM = (Number(radius) || 10) * 1000;
      const geoStage = {
        $geoNear: {
          near:          { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distance',
          maxDistance:   radiusM,
          spherical:     true,
          query:         filter,
        },
      };
      const sortStage = sort === 'distance'
        ? { $sort: { distance: 1 } }
        : { $sort: sortMap[sort] || { createdAt: -1 } };
 
      const pipeline = [
        geoStage, sortStage,
        { $skip: skip }, { $limit: lim },
        { $lookup: { from: 'users',      localField: 'ownerId',    foreignField: '_id', as: 'owner',    pipeline: [{ $project: { fullName: 1, avatar: 1, rating: 1, isVerified: 1 } }] } },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category', pipeline: [{ $project: { name: 1 } }] } },
        { $unwind: { path: '$owner',    preserveNullAndEmpty: true } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
      ];
 
      const [products, countResult] = await Promise.all([
        Product.aggregate(pipeline),
        Product.aggregate([geoStage, { $count: 'total' }]),
      ]);
      const withImages = await attachImages(products);
      const total = countResult[0]?.total || 0;
 
      return res.json({
        success: true,
        data: withImages,
        pagination: { total, page: Number(page), limit: lim, totalPages: Math.ceil(total / lim) },
      });
    }
 
    // ── Standard query ───────────────────────────
    const [raw, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip).limit(lim)
        .populate('ownerId', 'fullName avatar rating isVerified')
        .populate('categoryId', 'name')
        .lean(),
      Product.countDocuments(filter),
    ]);
    const products = await attachImages(raw);
 
    res.json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: lim, totalPages: Math.ceil(total / lim) },
    });
  } catch (err) {
    next(err);
  }
};
 
/* ───────────────────────────────────────────────────────────
   GET /api/products/:id
   Chi tiết sản phẩm + tất cả ảnh + thông tin người bán
─────────────────────────────────────────────────────────── */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('ownerId',    'fullName avatar phone rating isVerified location createdAt')
      .populate('categoryId', 'name description')
      .lean();
 
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
 
    const images = await ProductImage.find({ productId: product._id }).sort({ order: 1 });
    product.images    = images;
    product.thumbnail = images[0]?.imageUrl || null;
 
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
 
/* ───────────────────────────────────────────────────────────
   PUT /api/products/:id
   Cập nhật sản phẩm (chủ sở hữu)
─────────────────────────────────────────────────────────── */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    if (product.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Không có quyền' });
 
    const allowed = ['title', 'description', 'price', 'condition', 'type', 'categoryId', 'status', 'isAvailable'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
 
    if (req.body.address !== undefined || req.body.longitude !== undefined || req.body.latitude !== undefined) {
      product.location = {
        type:        'Point',
        coordinates: [
          Number(req.body.longitude ?? product.location.coordinates[0]),
          Number(req.body.latitude  ?? product.location.coordinates[1]),
        ],
        address: req.body.address ?? product.location.address,
      };
    }
 
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
 
/* ───────────────────────────────────────────────────────────
   DELETE /api/products/:id
   Xoá sản phẩm + toàn bộ ảnh (chủ sở hữu)
─────────────────────────────────────────────────────────── */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    if (product.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Không có quyền' });
 
    const images = await ProductImage.find({ productId: product._id });
    await Promise.all(images.map((img) => deleteFromCloudinary(img.publicId)));
    await ProductImage.deleteMany({ productId: product._id });
    await product.deleteOne();
 
    res.json({ success: true, message: 'Đã xoá sản phẩm' });
  } catch (err) {
    next(err);
  }
};
 
/* ───────────────────────────────────────────────────────────
   GET /api/products/seller/:userId
   Sản phẩm của một người bán (public)
─────────────────────────────────────────────────────────── */
exports.getSellerProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const lim  = Number(limit);
 
    const [raw, total] = await Promise.all([
      Product.find({ ownerId: req.params.userId, isAvailable: true })
        .sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('categoryId', 'name').lean(),
      Product.countDocuments({ ownerId: req.params.userId, isAvailable: true }),
    ]);
    const products = await attachImages(raw);
 
    res.json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: lim, totalPages: Math.ceil(total / lim) },
    });
  } catch (err) {
    next(err);
  }
};
 
/* ───────────────────────────────────────────────────────────
   GET /api/products/my
   Sản phẩm của chính mình (cần đăng nhập)
─────────────────────────────────────────────────────────── */
exports.getMyProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const lim    = Number(limit);
    const filter = { ownerId: req.user._id };
    if (status) filter.status = status;
 
    const [raw, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('categoryId', 'name').lean(),
      Product.countDocuments(filter),
    ]);
    const products = await attachImages(raw);
 
    res.json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: lim, totalPages: Math.ceil(total / lim) },
    });
  } catch (err) {
    next(err);
  }
};
 