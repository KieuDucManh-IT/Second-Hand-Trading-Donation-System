const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/notificationController");
 
// Tất cả route đều yêu cầu đăng nhập
router.use(protect);
 
router.get("/", ctrl.getMyNotifications);
router.patch("/read-all", ctrl.markAllRead);
router.patch("/:id/read", ctrl.markOneRead);
router.delete("/:id", ctrl.deleteOne);
 
module.exports = router;