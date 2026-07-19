const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/notificationController");
 
router.use(protect);
 
router.get("/", ctrl.getMyNotifications);
router.patch("/read-all", ctrl.markAllRead);
router.patch("/:id/read", ctrl.markOneRead);
router.delete("/:id", ctrl.deleteOne);
 
module.exports = router;