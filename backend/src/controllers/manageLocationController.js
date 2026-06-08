const User = require("../models/modelUser");
const mongoose = require("mongoose");

const addLocation = async (req, res) => {
  try {
    const { phoneNumber, address } = req.body;

    if (!phoneNumber || !address) {
      return res.status(400).json({
        message: "Vui lòng nhập số điện thoại và địa chỉ",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    user.locations.push({
      phoneNumber,
      address,
    });

    await user.save();

    return res.status(200).json({
      message: "Thêm địa chỉ thành công",
      locations: user.locations,
    });
  } catch (error) {
    console.error("ADD LOCATION ERROR:", error);

    return res.status(500).json({
      message: "Thêm địa chỉ thất bại",
      error: error.message,
    });
  }
};

const getMyLocations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const user = await User.findById(req.user._id).select("locations");

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    return res.status(200).json({
      message: "Lấy danh sách địa chỉ thành công",
      locations: user.locations,
    });
  } catch (error) {
    console.error("GET LOCATIONS ERROR:", error);

    return res.status(500).json({
      message: "Lấy danh sách địa chỉ thất bại",
      error: error.message,
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({
        message: "ID địa chỉ không hợp lệ",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const location = user.locations.id(locationId);

    if (!location) {
      return res.status(404).json({
        message: "Không tìm thấy địa chỉ cần xóa",
      });
    }

    user.locations.pull(locationId);

    await user.save();

    return res.status(200).json({
      message: "Xóa địa chỉ thành công",
      locations: user.locations,
    });
  } catch (error) {
    console.error("DELETE LOCATION ERROR:", error);

    return res.status(500).json({
      message: "Xóa địa chỉ thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  addLocation,
  getMyLocations,
  deleteLocation,
};