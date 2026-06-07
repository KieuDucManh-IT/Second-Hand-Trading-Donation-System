const crypto = require("crypto");

const otpStore = new Map();

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOTP = (email, otp) => {
  otpStore.set(email, {
    otpHash: hashOTP(otp),
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0
  });
};

const getOTP = (email) => {
  return otpStore.get(email);
};

const deleteOTP = (email) => {
  otpStore.delete(email);
};

const increaseAttempts = (email) => {
  const otpData = otpStore.get(email);

  if (otpData) {
    otpData.attempts += 1;
    otpStore.set(email, otpData);
  }
};

module.exports = {
  generateOTP,
  hashOTP,
  saveOTP,
  getOTP,
  deleteOTP,
  increaseAttempts
};