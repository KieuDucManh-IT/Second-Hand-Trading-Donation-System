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
    googleLogin
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");

router.post("/login", login);
router.post("/register/send-otp", sendRegisterOTP);
router.post("/register/verify-otp", verifyRegisterOTP);
router.patch("/change-password", protect, changePassword);
router.post("/forgot-password/send-otp", sendForgotPasswordOTP);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOTP);
router.patch("/add-location", protect, addLocation);
router.post("/google-login", googleLogin);


module.exports = router;