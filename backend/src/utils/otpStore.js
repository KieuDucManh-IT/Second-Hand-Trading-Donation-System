const crypto = require("crypto");

const otpStore = new Map();

const getOTPSecret = () => {
  const secret = process.env.OTP_HASH_SECRET;

  if (!secret) {
    throw new Error("Thiếu OTP_HASH_SECRET trong file .env");
  }

  return secret;
};

const hashOTP = (otp) => {
  return crypto
    .createHmac("sha256", getOTPSecret())
    .update(String(otp))
    .digest("hex");
};

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const saveOTP = (key, otp) => {
  otpStore.set(key, {
    otpHash: hashOTP(otp),
    expiresAt: Date.now() + 5 * 60 * 1000,
    createdAt: Date.now(),
    attempts: 0,
  });
};

const getOTP = (key) => {
  return otpStore.get(key);
};

const deleteOTP = (key) => {
  otpStore.delete(key);
};

const increaseAttempts = (key) => {
  const otpData = otpStore.get(key);

  if (otpData) {
    otpData.attempts += 1;
    otpStore.set(key, otpData);
  }
};

module.exports = {
  generateOTP,
  hashOTP,
  saveOTP,
  getOTP,
  deleteOTP,
  increaseAttempts,
};