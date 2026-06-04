const express = require("express");
const router = express.Router();

const {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  completeRegister
} = require("../controllers/authController");

router.post("/login", login);

router.post("/register/send-otp", sendRegisterOTP);
router.post("/register/verify-otp", verifyRegisterOTP);
// router.post("/register/complete", completeRegister);

module.exports = router;