const express = require("express");
const router = express.Router();

const {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  changePassword,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  googleLogin,
  updateAvatar,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");
const uploadAvatarMiddleware = require("../middlewares/uploadAvatarMiddleware");

router.post("/login", login);

router.post("/register/send-otp", sendRegisterOTP);
router.post("/register/verify-otp", verifyRegisterOTP);

router.patch("/change-password", protect, changePassword);

router.post("/forgot-password/send-otp", sendForgotPasswordOTP);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOTP);

router.post("/google-login", googleLogin);

router.patch("/update-avatar", protect, uploadAvatarMiddleware.single("avatar"), updateAvatar );

module.exports = router;