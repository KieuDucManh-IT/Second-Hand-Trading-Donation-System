const express = require("express");
const router = express.Router();

const {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  changePassword,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  addLocation,
  googleLogin,
  updateAvatar,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");
const uploadAvatar = require("../middlewares/uploadAvatar");

// Debug
console.log("login:", typeof login);
console.log("sendRegisterOTP:", typeof sendRegisterOTP);
console.log("verifyRegisterOTP:", typeof verifyRegisterOTP);
console.log("changePassword:", typeof changePassword);
console.log("sendForgotPasswordOTP:", typeof sendForgotPasswordOTP);
console.log("verifyForgotPasswordOTP:", typeof verifyForgotPasswordOTP);
console.log("addLocation:", typeof addLocation);
console.log("googleLogin:", typeof googleLogin);
console.log("updateAvatar:", typeof updateAvatar);
console.log("protect:", typeof protect);
console.log("uploadAvatar:", typeof uploadAvatar);
console.log("uploadAvatar.single:", typeof uploadAvatar.single);

router.post("/login", login);

router.post("/register/send-otp", sendRegisterOTP);
router.post("/register/verify-otp", verifyRegisterOTP);

router.patch("/change-password", protect, changePassword);

router.post("/forgot-password/send-otp", sendForgotPasswordOTP);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOTP);

router.patch("/add-location", protect, addLocation);

router.post("/google-login", googleLogin);

router.patch(
  "/update-avatar",
  protect,
  uploadAvatar.single("avatar"),
  updateAvatar
);

module.exports = router;