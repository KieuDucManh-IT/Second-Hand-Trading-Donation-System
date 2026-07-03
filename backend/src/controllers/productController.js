const Product      = require('../models/modelProduct');
const ProductImage = require('../models/modelProductImage');
const ExchangeInvoice = require('../models/modelExchangeInvoice');
const { deleteFromCloudinary } = require('../config/cloudinary');
const SystemConfig = require('../models/modelSystemConfig');
 

const getSensitiveWords = async () => {
  try {
    const config = await SystemConfig.findOne();
    if (config && Array.isArray(config.value)) {
      return config.value;
    }
  } catch (err) {
    console.error('Error fetching sensitive words from DB:', err);
  }
  return [];
};
 
/**
 * Kiểm tra văn bản có chứa từ nhạy cảm không
 * @returns {Promise<string|null>} từ vi phạm đầu tiên, hoặc null nếu sạch
 */
const findSensitiveWord = async (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  const words = await getSensitiveWords();
  return words.find((word) => lower.includes(word.toLowerCase())) || null;
};

exports.getSensitiveWordsRoute = async (req, res, next) => {
  try {
    const words = await getSensitiveWords();
    res.json({ success: true, data: words });
  } catch (err) {
    next(err);
  }
};
 

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

const getExchangeLockedProductIds = async () => {
  const activeStatuses = [
    'pending_receiver_accept',
    'waiting_deposits',
    'active',
    'both_confirmed',
    'disputed',
  ];

  const [requesterProductIds, receiverProductIds] = await Promise.all([
    ExchangeInvoice.distinct('requesterProduct', { status: { $in: activeStatuses } }),
    ExchangeInvoice.distinct('receiverProduct', { status: { $in: activeStatuses } }),
  ]);

  return [...new Set([...requesterProductIds, ...receiverProductIds].map(String))];
};
 
 
// POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const { title, description, price, condition, type, categoryId, address, longitude, latitude } = req.body;
 
    // ── Validate bắt buộc ────────────────────────────────────────────────────
    if (!title || !description || !condition || !type || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, description, condition, type, categoryId',
      });
    }
 
    if (!['sell', 'donate'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type phải là "sell" hoặc "donate"' });
    }
 
    if (type === 'sell' && (!price || Number(price) <= 0)) {
      return res.status(400).json({ success: false, message: 'Giá bán phải lớn hơn 0' });
    }
 
    // ── Content moderation ───────────────────────────────────────────────────
    const violationInTitle = await findSensitiveWord(title);
    if (violationInTitle) {
      return res.status(400).json({
        success: false,
        message: `Tiêu đề chứa từ không được phép: "${violationInTitle}". Vui lòng chỉnh sửa lại.`,
        field: 'title',
      });
    }
 
    const violationInDesc = await findSensitiveWord(description);
    if (violationInDesc) {
      return res.status(400).json({
        success: false,
        message: `Mô tả chứa từ không được phép: "${violationInDesc}". Vui lòng chỉnh sửa lại.`,
        field: 'description',
      });
    }
 
    const product = await Product.create({
      ownerId: req.user._id,
      categoryId,
      title,
      description,
      price:    type === 'donate' ? 0 : Number(price) || 0,
      condition,
      type,
      status:   'available',     
      isAvailable: true,         
      pendingApproval: false,    
      location: {
        type:        'Point',
        coordinates: [Number(longitude) || 0, Number(latitude) || 0],
        address:     address || '',
      },
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Sản phẩm đã được đăng thành công',
    });
  } catch (err) {
    next(err);
  }
};
 
// POST /api/products/:id/images (tối đa 8 ảnh)
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
        imageUrl:  f.path,
        publicId:  f.filename,
        order:     existing + i,
      }))
    );
 
    res.status(201).json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
};
 
// DELETE /api/products/images/:imageId
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
 
// GET /api/products - danh sách public (chỉ available + isAvailable)
exports.getProducts = async (req, res, next) => {
  try {
    const {
      keyword, categoryId, type, condition,
      minPrice, maxPrice,
      lat, lng, radius,
      page = 1, limit = 20, sort = 'createdAt',
    } = req.query;

    const filter = { isAvailable: true, status: 'available' };
    const lockedProductIds = await getExchangeLockedProductIds();
    if (lockedProductIds.length > 0) {
      filter._id = { $nin: lockedProductIds };
    }
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
 
// GET /api/products/:id
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
 
// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    if (product.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Không có quyền' });
 
    // Nếu user edit title/description => reset về pending review lại
    const textChanged = req.body.title !== undefined || req.body.description !== undefined;
 
    if (req.body.title) {
      const v = await findSensitiveWord(req.body.title);
      if (v) return res.status(400).json({ success: false, message: `Tiêu đề chứa từ không được phép: "${v}"`, field: 'title' });
    }
    if (req.body.description) {
      const v = await findSensitiveWord(req.body.description);
      if (v) return res.status(400).json({ success: false, message: `Mô tả chứa từ không được phép: "${v}"`, field: 'description' });
    }
 
    const allowed = ['title', 'description', 'price', 'condition', 'type', 'categoryId', 'status', 'isAvailable'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
 
    if (textChanged) {
      product.status      = 'hidden';
      product.isAvailable = false;
      product.pendingApproval = true;
    }
 
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
    res.json({
      success: true,
      data: product,
      message: textChanged ? 'Sản phẩm đã được cập nhật và đang chờ duyệt lại' : 'Đã cập nhật',
    });
  } catch (err) {
    next(err);
  }
};
 
// DELETE /api/products/:id
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
 
// GET /api/products/seller/:userId
exports.getSellerProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const lim  = Number(limit);
 
    const query = {
      ownerId: req.params.userId,
      status: { $in: ['available', 'sold', 'reserved'] },
    };

    const [raw, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('categoryId', 'name').lean(),
      Product.countDocuments(query),
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
 
// GET /api/products/my
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
 
// ── Manager routes ────────────────────────────────────────────────────────────
 
// GET /api/products/pending  (manager only — cần thêm vào route file)
exports.getPendingProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const lim  = Number(limit);
 
    const filter = { pendingApproval: true };
    const [raw, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('ownerId',    'fullName email avatar')
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
 
// PUT /api/products/:id/approve  (manager only)
exports.approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
 
    product.status          = 'available';
    product.isAvailable     = true;
    product.pendingApproval = false;
    await product.save();
 
    res.json({ success: true, message: 'Đã duyệt sản phẩm', data: product });
  } catch (err) {
    next(err);
  }
};
 
// PUT /api/products/:id/reject  (manager only)
exports.rejectProduct = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
 
    product.status          = 'hidden';
    product.isAvailable     = false;
    product.pendingApproval = false;
    product.rejectReason    = reason || 'Vi phạm quy định';
    await product.save();
 
    res.json({ success: true, message: 'Đã từ chối sản phẩm', data: product });
  } catch (err) {
    next(err);
  }
};

exports.getMyProductsForExchange = async (req, res) => {
  try {
    const Product = require("../models/modelProduct");

    const userId = req.user?._id || req.user?.id || req.userId;
    const { excludeProductId } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    const query = {
      status: "available",
      isAvailable: true,
      $or: [
        { ownerId: userId },
        { userId: userId },
        { user: userId },
        { owner: userId },
        { seller: userId },
        { createdBy: userId },
      ],
    };

    const lockedProductIds = await getExchangeLockedProductIds();
    if (lockedProductIds.length > 0) {
      query._id = { $nin: lockedProductIds };
    }

    if (excludeProductId) {
      query._id = query._id || {};
      query._id.$ne = excludeProductId;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET MY PRODUCTS FOR EXCHANGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy sản phẩm để trao đổi",
    });
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const Order = require("../models/modelOrder");
    const { id } = req.params;

    const reviews = await Order.find({
      productId: id,
      "sellerRating.rating": { $exists: true, $gt: 0 }
    })
    .populate("buyerId", "fullName avatar email userName")
    .sort({ "sellerRating.ratedAt": -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const User = require("../models/modelUser");
    const { id } = req.params;
    const userId = req.user._id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại hoặc đã bị xóa" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    const index = user.favorites.indexOf(id);
    let isFavorite = false;
    if (index === -1) {
      user.favorites.push(id);
      isFavorite = true;
    } else {
      user.favorites.splice(index, 1);
      isFavorite = false;
    }

    await user.save();
    res.json({
      success: true,
      message: isFavorite ? "Đã thêm vào danh sách yêu thích" : "Đã xóa khỏi danh sách yêu thích",
      isFavorite
    });
  } catch (err) {
    next(err);
  }
};

exports.getFavoriteProducts = async (req, res, next) => {
  try {
    const User = require("../models/modelUser");
    const userId = req.user._id;

    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const favoritedProducts = (user.favorites || []).filter(p => p != null);
    const raw = favoritedProducts.map(p => p.toObject ? p.toObject() : p);

    const populated = await Product.populate(raw, [
      { path: 'ownerId', select: 'fullName avatar rating isVerified' },
      { path: 'categoryId', select: 'name' }
    ]);

    const validProducts = populated.filter(p => p != null);
    const products = await attachImages(validProducts);

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    next(err);
  }
};
