const User = require("../models/modelUser");
const Category = require("../models/modelCategory");
const Product = require("../models/modelProduct");
const Report = require("../models/modelReport");
const Order = require("../models/modelOrder");

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
  rating: user.rating || 0,
  warningsCount: user.warningsCount || 0,
  createdAt: user.createdAt,
});

const getDashboard = async (req, res) => {
  try {
    const [users, categories, reports, pendingProducts, orders, totalProducts, totalCategories] =
      await Promise.all([
        User.find().sort({ createdAt: -1 }).select("-password").lean(),
        Category.find().sort({ name: 1 }).lean(),
        Report.find().sort({ createdAt: -1 }).populate("reporterId", "userName fullName").lean(),
        Product.find({ status: "pending" })
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

    res.status(200).json({
      users: users.map(buildUserResponse),
      categories,
      reports: reports.map(buildReportResponse),
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
        suspendedUsers: users.filter((u) => u.status === "suspended").length,
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
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.warningsCount = (user.warningsCount || 0) + 1;
    user.lastWarningAt = new Date();
    if (user.warningsCount >= 3 && user.status === "active") {
      user.status = "suspended";
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
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Tên danh mục là bắt buộc" });

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
    const { name, description } = req.body;
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
    const products = await Product.find({ status: "pending" })
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
    if (!["draft", "pending", "active", "sold", "archived"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái sản phẩm không hợp lệ" });
    }

    const product = await Product.findById(req.params.id)
      .populate("ownerId", "userName fullName")
      .populate("categoryId", "name");
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    product.status = status;
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
      .populate("reporterId", "userName fullName");
    res.status(200).json({ reports: reports.map(buildReportResponse) });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải danh sách báo cáo", error: error.message });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { status } = req.body;
    if (status && !["resolved", "rejected", "reviewing", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái báo cáo không hợp lệ" });
    }

    const report = await Report.findById(req.params.id).populate("reporterId", "userName fullName");
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    report.status = status || "resolved";
    await report.save();
    res.status(200).json({ message: "Đã xử lý báo cáo", report: buildReportResponse(report) });
  } catch (error) {
    res.status(500).json({ message: "Không thể xử lý báo cáo", error: error.message });
  }
};

const dismissReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("reporterId", "userName fullName");
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    report.status = "dismissed";
    await report.save();
    res.status(200).json({ message: "Đã từ chối báo cáo", report: buildReportResponse(report) });
  } catch (error) {
    res.status(500).json({ message: "Không thể từ chối báo cáo", error: error.message });
  }
};

const getStatistics = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalDonations, totalTransactions,
      totalReports, activeUsers, suspendedUsers, bannedUsers, warningUsers, totalCategories] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Product.countDocuments({ type: "donate" }),
        Order.countDocuments({ $or: [{ status: "completed" }, { paymentStatus: "paid" }] }),
        Report.countDocuments(),
        User.countDocuments({ status: "active" }),
        User.countDocuments({ status: "suspended" }),
        User.countDocuments({ status: "banned" }),
        User.countDocuments({ warningsCount: { $gt: 0 } }),
        Category.countDocuments(),
      ]);

    res.status(200).json({
      statistics: {
        totalUsers, totalProducts, totalOrders, totalDonations, totalTransactions,
        totalReports, totalCategories, activeUsers, suspendedUsers, bannedUsers, warningUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể tải thống kê hệ thống", error: error.message });
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
  resolveReport,
  dismissReport,
  getStatistics,
};
