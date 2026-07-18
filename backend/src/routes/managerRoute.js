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
  getConfig,
  updateConfig,
  deleteProduct,
  getDisputes,
  resolveDispute,
  repairExchangeProducts,
} = require("../controllers/managerController");

const { protect, authorize } = require("../middlewares/authMiddleware");

router.use(protect, authorize("manager"));

router.get("/dashboard", getDashboard);
router.get("/statistics", getStatistics);

router.put("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.post("/users/:id/warn", warnUser);

router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/products", getAllProducts);
router.get("/products/pending", getPendingProducts);
router.patch("/products/:id/status", updateProductStatus);
router.delete("/products/:id", deleteProduct);

router.get("/reports", getReports);
router.patch("/reports/:id/accept", acceptReport);
router.patch("/reports/:id/reject", rejectReport);

router.get("/disputes", getDisputes);
router.post("/disputes/resolve", resolveDispute);

router.post("/repair-exchange-products", repairExchangeProducts);


router.get("/config", getConfig);
router.post("/config", updateConfig);

module.exports = router;
