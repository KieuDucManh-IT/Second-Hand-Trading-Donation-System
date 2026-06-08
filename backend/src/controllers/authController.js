const User = require("../models/modelUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const cloudinary = require("../config/cloudinary");

const {
  generateOTP,
  hashOTP,
  saveOTP,
  getOTP,
  deleteOTP,
  increaseAttempts
} = require("../utils/otpStore");

const sendRegisterOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email đã được sử dụng"
      });
    }

    const otp = generateOTP();

    saveOTP(email, otp);

    await sendEmail({
      to: email,
      subject: "Mã OTP xác thực tài khoản Fashion Ecommerce",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Xác thực tài khoản</h2>
          <p>Mã OTP của bạn là:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
          <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
        </div>
      `
    });

    return res.status(200).json({
      message: "OTP đã được gửi đến email của bạn"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể gửi OTP",
      error: error.message
    });
  }
};

const verifyRegisterOTP = async (req, res) => {
  try {
    const { userName, email, password, otp } = req.body;
    console.log("Body received in verifyRegisterOTP:", req.body);

    if (!userName || !email || !password || !otp) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email đã được sử dụng"
      });
    }

    const otpData = getOTP(email);

    if (!otpData) {
      return res.status(400).json({
        message: "OTP không tồn tại hoặc đã hết hạn"
      });
    }

    if (otpData.expiresAt < Date.now()) {
      deleteOTP(email);

      return res.status(400).json({
        message: "OTP đã hết hạn"
      });
    }

    if (otpData.attempts >= 5) {
      deleteOTP(email);

      return res.status(400).json({
        message: "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng gửi lại OTP"
      });
    }

    const inputOtpHash = hashOTP(otp);

    if (inputOtpHash !== otpData.otpHash) {
      increaseAttempts(email);

      return res.status(400).json({
        message: "OTP không chính xác"
      });
    }

    const user = await User.create({
      userName,
      email,
      password
    });

    deleteOTP(email);

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Đăng ký thất bại",
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Email hoặc password không đúng",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "Tài khoản này chưa có mật khẩu. Vui lòng đăng nhập bằng Google hoặc tạo mật khẩu trước.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email hoặc password không đúng",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login thành công",
      token,
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        rating: user.rating,
        avatar: user.avatar,
        locations: user.locations,
        authProvider: user.authProvider,
        hasPassword: !!user.password,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Đăng nhập thất bại",
      error: err.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu mới và xác nhận mật khẩu",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Xác nhận mật khẩu không khớp",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    // Trường hợp user chưa có password, ví dụ đăng nhập Google trước
    if (!user.password) {
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        message: "Tạo mật khẩu thành công. Từ giờ bạn có thể đăng nhập bằng email và mật khẩu.",
      });
    }

    // Trường hợp user đã có password thì bắt buộc nhập mật khẩu hiện tại
    if (!currentPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu hiện tại",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Đổi mật khẩu thất bại",
      error: error.message,
    });
  }
};

const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email không tồn tại trong hệ thống"
      });
    }

    const otp = generateOTP();

    saveOTP(email, otp);

    await sendEmail({
      to: email,
      subject: "Mã OTP đặt lại mật khẩu Fashion Ecommerce",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Đặt lại mật khẩu</h2>
          <p>Mã OTP của bạn là:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `
    });

    return res.status(200).json({
      message: "OTP đặt lại mật khẩu đã được gửi đến email của bạn"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể gửi OTP đặt lại mật khẩu",
      error: error.message
    });
  }
};

const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Xác nhận mật khẩu không khớp"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email không tồn tại trong hệ thống"
      });
    }

    const otpData = getOTP(email);

    if (!otpData) {
      return res.status(400).json({
        message: "OTP không tồn tại hoặc đã hết hạn"
      });
    }

    if (otpData.expiresAt < Date.now()) {
      deleteOTP(email);

      return res.status(400).json({
        message: "OTP đã hết hạn"
      });
    }

    if (otpData.attempts >= 5) {
      deleteOTP(email);

      return res.status(400).json({
        message: "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng gửi lại OTP"
      });
    }

    const inputOtpHash = hashOTP(otp);

    if (inputOtpHash !== otpData.otpHash) {
      increaseAttempts(email);

      return res.status(400).json({
        message: "OTP không chính xác"
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng với mật khẩu cũ"
      });
    }

    user.password = newPassword;

    await user.save();

    deleteOTP(email);

    return res.status(200).json({
      message: "Đặt lại mật khẩu thành công"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Đặt lại mật khẩu thất bại",
      error: error.message
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Thiếu Google credential",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const avatar = payload.picture || "";

    if (!email) {
      return res.status(400).json({
        message: "Không lấy được email từ Google",
      });
    }

    const userName = payload.name || email.split("@")[0];

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        userName,
        email,
        googleId,
        avatar,
        authProvider: "google",
        role: "user",
      });
    } else {
      user.googleId = user.googleId || googleId;
      user.avatar = user.avatar || avatar;

      if (!user.password) {
        user.authProvider = "google";
      }

      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login Google thành công",
      token,
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        rating: user.rating,
        avatar: user.avatar,
        locations: user.locations,
        authProvider: user.authProvider,
        hasPassword: !!user.password,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login Google thất bại",
      error: error.message,
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng chọn ảnh avatar",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "secondlife/avatars",
      public_id: `avatar_${user._id}_${Date.now()}`,
      resource_type: "image",
    });

    user.avatar = uploadResult.secure_url;
    await user.save();

    return res.status(200).json({
      message: "Cập nhật avatar thành công",
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        rating: user.rating,
        avatar: user.avatar,
        locations: user.locations,
        authProvider: user.authProvider,
        hasPassword: !!user.password,
      },
    });
  } catch (error) {
    console.error("UPDATE AVATAR ERROR:", error);

    return res.status(500).json({
      message: "Cập nhật avatar thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  changePassword,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  googleLogin,
  updateAvatar
};