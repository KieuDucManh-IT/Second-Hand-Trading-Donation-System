const User = require("../models/modelUser");
const Category = require("../models/modelCategory");
const Product = require("../models/modelProduct");
const Report = require("../models/modelReport");
const Order = require("../models/modelOrder");
const SystemConfig = require("../models/modelSystemConfig");

const validateInput = (value, fieldName, isDescription = false) => {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} là bắt buộc và không được để trống.`);
  }
  const cleanVal = value.trim();

  if (/<[^>]*>/g.test(cleanVal) || /[<>]/.test(cleanVal)) {
    throw new Error(`${fieldName} không được chứa các thẻ HTML hoặc các ký tự <, >.`);
  }

  if (/(.)\1{3,}/i.test(cleanVal)) {
    throw new Error(`${fieldName} không được chứa một ký tự lặp lại quá 3 lần liên tiếp.`);
  }

  const minLength = isDescription ? 5 : 2;
  const maxLength = isDescription ? 500 : 100;
  if (cleanVal.length < minLength) {
    throw new Error(`${fieldName} phải chứa ít nhất ${minLength} ký tự.`);
  }
  if (cleanVal.length > maxLength) {
    throw new Error(`${fieldName} không được vượt quá ${maxLength} ký tự.`);
  }

  return cleanVal;
};

const buildProductResponse = (product) => ({
  id: product._id,
  title: product.title,
  description: product.description,
  price: product.price,
  condition: product.condition || "",
  isDonation: product.type === "donate",
  status: product.status,
  createdAt: product.createdAt,
  sellerName: product.ownerId?.userName || product.ownerId?.fullName || "Unknown",
  category: product.categoryId?.name || "Uncategorized",
});

const buildReportResponse = (report) => ({
  id: report._id,
  reporterName: report.reporterId?.userName || report.reporterId?.fullName || "Unknown",
  targetType: report.targetType,
  targetId: report.targetId,
  reason: report.reason,
  adminReason: report.adminReason || "",
  status: report.status,
  createdAt: report.createdAt,
});

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.fullName || user.email,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  status: user.status,
  rating: user.rating || 5,
  warningsCount: user.warningsCount || 0,
  createdAt: user.createdAt,
});

const enrichReports = async (reports) => {
  return await Promise.all(
    reports.map(async (report) => {
      let targetUser = null;
      let targetDetail = null;
      if (report.targetType === "user") {
        targetUser = await User.findById(report.targetId).select("warningsCount fullName email userName avatar status").lean();
        if (targetUser) {
          targetDetail = {
            fullName: targetUser.fullName,
            email: targetUser.email,
            userName: targetUser.userName,
            avatar: targetUser.avatar,
            status: targetUser.status
          };
        }
      } else if (report.targetType === "product") {
        const product = await Product.findById(report.targetId).populate("ownerId", "warningsCount fullName email").lean();
        if (product) {
          if (product.ownerId) {
            targetUser = product.ownerId;
          }
          targetDetail = {
            title: product.title,
            description: product.description,
            price: product.price,
            type: product.type,
            condition: product.condition,
            status: product.status,
            address: product.location ? product.location.address : ""
          };
        }
      }
      return {
        ...buildReportResponse(report),
        targetWarnings: targetUser ? (targetUser.warningsCount || 0) : 0,
        targetName: targetUser ? (targetUser.fullName || targetUser.email || "Unknown") : "Unknown",
        targetDetail: targetDetail,
      };
    })
  );
};

const getDashboard = async (req, res) => {
  try {
    const [users, categories, reports, pendingProducts, orders, totalProducts, totalCategories] =
      await Promise.all([
        User.find().sort({ createdAt: -1 }).select("-password").lean(),
        Category.find().sort({ name: 1 }).lean(),
        Report.find().sort({ createdAt: -1 }).populate("reporterId", "userName fullName").lean(),
        Product.find({ pendingApproval: true })
          .sort({ createdAt: -1 })
          .populate("ownerId", "userName fullName")
          .populate("categoryId", "name")
          .lean(),
        Order.find().lean(),
        Product.countDocuments(),
        Category.countDocuments(),
      ]);

    const totalDonations = await Product.countDocuments({ type: "donate" });
    const totalTransactions = await Order.countDocuments({
      $or: [{ status: "completed" }, { paymentStatus: "paid" }],
    });

    const enrichedReports = await enrichReports(reports);

    res.status(200).json({
      users: users.map(buildUserResponse),
      categories,
      reports: enrichedReports,
      pendingProducts: pendingProducts.map(buildProductResponse),
      statistics: {
        totalUsers: users.length,
        totalProducts,
        totalOrders: orders.length,
        totalDonations,
        totalTransactions,
        totalReports: reports.length,
        totalCategories,
        activeUsers: users.filter((u) => u.status === "active").length,
        bannedUsers: users.filter((u) => u.status === "banned").length,
        warningUsers: users.filter((u) => (u.warningsCount || 0) > 0).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải dashboard quản trị", error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái người dùng không hợp lệ" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.status = status;
    await user.save();

    res.status(200).json({ message: "Cập nhật trạng thái thành công", user: buildUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật trạng thái người dùng", error: error.message });
  }
};

const warnUser = async (req, res) => {
  try {
    let { reason } = req.body;
    try {
      reason = validateInput(reason, "Lý do cảnh cáo", false);
    } catch (valError) {
      return res.status(400).json({ message: valError.message });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.warningsCount = (user.warningsCount || 0) + 1;
    user.lastWarningAt = new Date();
    if (user.warningsCount >= 12 && user.status === "active") {
      user.status = "banned";
    }
    await user.save();

    res.status(200).json({
      message: reason ? `Đã cảnh báo người dùng: ${reason}` : "Đã cảnh báo người dùng",
      user: buildUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể cảnh báo người dùng", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;

    await user.save();
    res.status(200).json({ message: "Cập nhật người dùng thành công", user: buildUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật người dùng", error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải danh mục sản phẩm", error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    let { name, description } = req.body;
    try {
      name = validateInput(name, "Tên danh mục", false);
      description = validateInput(description, "Mô tả danh mục", true);
    } catch (valError) {
      return res.status(400).json({ message: valError.message });
    }

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: "Danh mục này đã tồn tại" });

    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({ message: "Tạo danh mục thành công", category });
  } catch (error) {
    res.status(500).json({ message: "Không thể tạo danh mục", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    let { name, description } = req.body;
    try {
      if (name !== undefined) name = validateInput(name, "Tên danh mục", false);
      if (description !== undefined) description = validateInput(description, "Mô tả danh mục", true);
    } catch (valError) {
      return res.status(400).json({ message: valError.message });
    }

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;

    await category.save();
    res.status(200).json({ message: "Cập nhật danh mục thành công", category });
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật danh mục", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const productsUsing = await Product.findOne({ categoryId: id });
    if (productsUsing) {
      return res.status(400).json({ message: "Không thể xóa danh mục đang có sản phẩm liên kết" });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });

    res.status(200).json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa danh mục", error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("ownerId", "fullName userName")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ products: products.map(buildProductResponse) });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách sản phẩm", error: error.message });
  }
};

const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ pendingApproval: true })
      .sort({ createdAt: -1 })
      .populate("ownerId", "userName fullName")
      .populate("categoryId", "name");
    res.status(200).json({ pendingProducts: products.map(buildProductResponse) });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải sản phẩm chờ duyệt", error: error.message });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["available", "sold", "reserved", "hidden"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái sản phẩm không hợp lệ" });
    }

    const product = await Product.findById(req.params.id)
      .populate("ownerId", "userName fullName")
      .populate("categoryId", "name");
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    product.status = status;
    if (status === "available") {
      product.isAvailable = true;
      product.pendingApproval = false;
    } else {
      product.isAvailable = false;
      product.pendingApproval = false;
    }
    await product.save();
    res.status(200).json({ message: "Cập nhật trạng thái sản phẩm thành công", product: buildProductResponse(product) });
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật trạng thái sản phẩm", error: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate("reporterId", "userName fullName")
      .lean();
    const enriched = await enrichReports(reports);
    res.status(200).json({ reports: enriched });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải danh sách báo cáo", error: error.message });
  }
};

const acceptReport = async (req, res) => {
  try {
    let { reason } = req.body;
    try {
      reason = validateInput(reason, "Lý do cảnh cáo", false);
    } catch (valError) {
      return res.status(400).json({ message: valError.message });
    }

    const report = await Report.findById(req.params.id).populate("reporterId", "userName fullName");
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    let userIdToWarn = null;

    if (report.targetType === "user") {
      userIdToWarn = report.targetId;
    } else if (report.targetType === "product") {
      const product = await Product.findById(report.targetId);
      if (product) {
        userIdToWarn = product.ownerId;
      }
    } else {
      userIdToWarn = report.targetId;
    }

    if (userIdToWarn) {
      const user = await User.findById(userIdToWarn);
      if (user) {
        user.warningsCount = (user.warningsCount || 0) + 1;
        user.lastWarningAt = new Date();
        if (user.warningsCount >= 12 && user.status === "active") {
          user.status = "banned";
        }
        await user.save();
      }
    }

    report.status = "accept";
    report.adminReason = reason;
    await report.save();
    res.status(200).json({ message: "Đã chấp nhận báo cáo và cộng điểm cảnh cáo cho người dùng", report: buildReportResponse(report) });
  } catch (error) {
    res.status(500).json({ message: "Không thể chấp nhận báo cáo", error: error.message });
  }
};

const rejectReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("reporterId", "userName fullName");
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    report.status = "reject";
    await report.save();
    res.status(200).json({ message: "Đã từ chối báo cáo", report: buildReportResponse(report) });
  } catch (error) {
    res.status(500).json({ message: "Không thể từ chối báo cáo", error: error.message });
  }
};



const getStatistics = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalDonations, totalTransactions,
      totalReports, activeUsers, bannedUsers, warningUsers, totalCategories] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Product.countDocuments({ type: "donate" }),
        Order.countDocuments({ $or: [{ status: "completed" }, { paymentStatus: "paid" }] }),
        Report.countDocuments(),
        User.countDocuments({ status: "active" }),
        User.countDocuments({ status: "banned" }),
        User.countDocuments({ warningsCount: { $gt: 0 } }),
        Category.countDocuments(),
      ]);

    res.status(200).json({
      statistics: {
        totalUsers, totalProducts, totalOrders, totalDonations, totalTransactions,
        totalReports, totalCategories, activeUsers, bannedUsers, warningUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải thống kê hệ thống", error: error.message });
  }
};

const getConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({ value: [] });
    }
    res.status(200).json({ success: true, keywords: config.value || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể lấy cấu hình hệ thống", error: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    let { keywords } = req.body;
    
    let wordsArray = [];
    if (Array.isArray(keywords)) {
      wordsArray = keywords;
    } else if (typeof keywords === 'string') {
      wordsArray = keywords.split(/[,;]/);
    } else {
      return res.status(400).json({ success: false, message: "Danh sách từ khóa không hợp lệ" });
    }

    const cleanKeywords = [...new Set(wordsArray.map(k => typeof k === 'string' ? k.trim().toLowerCase() : '').filter(Boolean))];

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig({ value: cleanKeywords });
    } else {
      config.value = cleanKeywords;
    }
    await config.save();

    res.status(200).json({ success: true, message: "Cập nhật cấu hình thành công", keywords: config.value });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể cập nhật cấu hình hệ thống", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const ProductImage = require("../models/modelProductImage");
    const { deleteFromCloudinary } = require("../config/cloudinary");
    const images = await ProductImage.find({ productId: product._id });
    await Promise.all(images.map((img) => {
      if (img.publicId) {
        return deleteFromCloudinary(img.publicId).catch(err => console.error("Cloudinary delete failed:", err));
      }
    }));
    await ProductImage.deleteMany({ productId: product._id });
    await product.deleteOne();

    res.status(200).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa sản phẩm", error: error.message });
  }
};

const getDisputes = async (req, res) => {
  try {
    const ExchangeInvoice = require("../models/modelExchangeInvoice");
    const Order = require("../models/modelOrder");

    // Lấy TẤT CẢ orders có trường complaint (bao gồm cả đã resolved/rejected)
    // Frontend tự phân loại theo complaint.status để hiển thị "Cần xử lý" vs "Lịch sử"
    const orders = await Order.find({
      complaint: { $exists: true, $ne: null },
    })
      .populate("buyerId", "fullName email phone avatar")
      .populate("sellerId", "fullName email phone avatar")
      .populate("productId", "title price thumbnail description")
      .sort({ updatedAt: -1 });

    // Lấy TẤT CẢ exchanges có trường complaint (bao gồm cả đã resolved/rejected)
    const exchanges = await ExchangeInvoice.find({
      complaint: { $exists: true, $ne: null },
    })
      .populate("requester", "fullName email phone avatar")
      .populate("receiver", "fullName email phone avatar")
      .populate("disputeBy", "fullName email phone avatar")
      .populate("counterDisputeBy", "fullName email phone avatar")
      .populate("requesterProduct", "title price thumbnail description")
      .populate("receiverProduct", "title price thumbnail description")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      orders,
      exchanges,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể lấy danh sách tranh chấp", error: error.message });
  }
};

const repairExchangeProducts = async (req, res) => {
  try {
    const exchangeEscrowService = require("../services/exchangeEscrowService");
    const results = await exchangeEscrowService.repairExchangeProductStatuses();
    res.status(200).json({
      success: true,
      message: `Đã đồng bộ ${results.fixed} sản phẩm`,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể sửa sản phẩm", error: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { disputeId, type, resolution, hasReturnedGoods, resolutionNote } = req.body;

    if (!disputeId || !type || !resolution) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin yêu cầu giải quyết tranh chấp" });
    }

    if (type === "order") {
      const escrowService = require("../services/escrowService");
      const order = await escrowService.resolveOrderDispute(disputeId, resolution, resolutionNote);
      return res.status(200).json({ success: true, message: "Giải quyết tranh chấp đơn hàng thành công", data: order });
    } else if (type === "exchange") {
      const exchangeEscrowService = require("../services/exchangeEscrowService");
      const invoice = await exchangeEscrowService.resolveExchangeDispute(
        disputeId,
        resolution,
        hasReturnedGoods === true,
        resolutionNote
      );
      return res.status(200).json({ success: true, message: "Giải quyết tranh chấp trao đổi thành công", data: invoice });
    } else {
      return res.status(400).json({ success: false, message: "Loại giao dịch không hợp lệ" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Không thể giải quyết tranh chấp" });
  }
};

module.exports = {
  getDashboard,
  updateUserStatus,
  warnUser,
  updateUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getPendingProducts,
  updateProductStatus,
  getReports,
  acceptReport,
  rejectReport,
  getStatistics,
  getConfig,
  updateConfig,
  deleteProduct,
  getDisputes,
  resolveDispute,
  repairExchangeProducts,
};
