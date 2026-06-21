const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/managerController");

const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("manager"));

// Dashboard
router.get("/dashboard", getDashboard);
router.get("/statistics", getStatistics);

// Users
router.put("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.post("/users/:id/warn", warnUser);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Products
router.get("/products", getAllProducts);
router.get("/products/pending", getPendingProducts);
router.patch("/products/:id/status", updateProductStatus);

// Reports
router.get("/reports", getReports);
router.patch("/reports/:id/accept", acceptReport);
router.patch("/reports/:id/reject", rejectReport);
module.exports = router;
