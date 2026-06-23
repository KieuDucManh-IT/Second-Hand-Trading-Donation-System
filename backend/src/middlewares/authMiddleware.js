const jwt  = require("jsonwebtoken");
const User = require("../models/modelUser");
 
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn", error: error.message });
  }
};
 

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền. Yêu cầu role: ${roles.join(" hoặc ")}`,
    });
  }
  next();
};
 
module.exports = { protect, authorize };
